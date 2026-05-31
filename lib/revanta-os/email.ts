import net from "node:net";
import tls from "node:tls";
import { prisma } from "@/lib/revanta-os/db";
import { toJsonValue } from "@/lib/revanta-os/json";

type SmtpConnection = net.Socket | tls.TLSSocket;

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.trim();
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  return { host, port, user, password, secure };
}

function escapeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function buildMessage(params: { from: string; to: string; subject: string; text?: string; html?: string }) {
  const boundary = `revanta-${Date.now().toString(36)}`;
  const headers = [
    `From: ${escapeHeader(params.from)}`,
    `To: ${escapeHeader(params.to)}`,
    `Subject: ${escapeHeader(params.subject)}`,
    "MIME-Version: 1.0"
  ];

  if (params.html) {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    return [
      headers.join("\r\n"),
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      params.text || params.html.replace(/<[^>]*>/g, ""),
      `--${boundary}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      params.html,
      `--${boundary}--`,
      ""
    ].join("\r\n");
  }

  headers.push("Content-Type: text/plain; charset=utf-8");
  return `${headers.join("\r\n")}\r\n\r\n${params.text || ""}\r\n`;
}

function decodeBase64(text: string) {
  return Buffer.from(text, "base64").toString("utf8");
}

function encodeBase64(text: string) {
  return Buffer.from(text, "utf8").toString("base64");
}

async function readResponse(socket: SmtpConnection) {
  return await new Promise<{ code: number; lines: string[] }>((resolve, reject) => {
    let buffer = "";
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/);
      if (!buffer.endsWith("\n")) {
        buffer = lines.pop() ?? "";
      } else {
        buffer = "";
      }
      const lastLine = lines.filter(Boolean).at(-1) || "";
      if (/^\d{3} /.test(lastLine)) {
        socket.off("data", onData);
        const code = Number(lastLine.slice(0, 3));
        resolve({ code, lines: lines.filter(Boolean) });
      }
    };
    socket.on("data", onData);
    socket.once("error", reject);
  });
}

async function sendCommand(socket: SmtpConnection, command: string) {
  socket.write(`${command}\r\n`);
  return readResponse(socket);
}

async function connectSmtp() {
  const { host, port, secure } = smtpConfig();
  if (!host) {
    throw new Error("SMTP host is not configured.");
  }

  const socket = secure ? tls.connect({ host, port, servername: host }) : net.createConnection({ host, port });
  await new Promise<void>((resolve, reject) => {
    socket.once("connect", () => resolve());
    socket.once("secureConnect", () => resolve());
    socket.once("error", reject);
  });

  const banner = await readResponse(socket);
  if (banner.code !== 220) {
    socket.destroy();
    throw new Error(`SMTP connection failed: ${banner.lines.join(" ")}`);
  }

  return socket;
}

export async function sendSmtpEmail(params: {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const { user, password, secure } = smtpConfig();
  if (!user || !password) {
    throw new Error("SMTP username and password are required.");
  }

  const socket = await connectSmtp();
  try {
    let response = await sendCommand(socket, `EHLO ${process.env.SMTP_EHLO || "revanta.local"}`);
    if (response.code !== 250) {
      throw new Error(`SMTP EHLO failed: ${response.lines.join(" ")}`);
    }

    if (!secure && process.env.SMTP_STARTTLS === "true") {
      throw new Error("STARTTLS upgrade is not implemented in the lightweight SMTP client. Use SMTP_SECURE=true or port 465.");
    }

    response = await sendCommand(socket, "AUTH LOGIN");
    if (response.code !== 334) {
      throw new Error(`SMTP AUTH failed: ${response.lines.join(" ")}`);
    }

    response = await sendCommand(socket, encodeBase64(user));
    if (response.code !== 334) {
      throw new Error(`SMTP username rejected: ${response.lines.join(" ")}`);
    }

    response = await sendCommand(socket, encodeBase64(password));
    if (response.code !== 235) {
      throw new Error(`SMTP password rejected: ${response.lines.join(" ")}`);
    }

    response = await sendCommand(socket, `MAIL FROM:<${params.from}>`);
    if (response.code !== 250) throw new Error(`SMTP MAIL FROM failed: ${response.lines.join(" ")}`);

    response = await sendCommand(socket, `RCPT TO:<${params.to}>`);
    if (response.code !== 250 && response.code !== 251) {
      throw new Error(`SMTP RCPT TO failed: ${response.lines.join(" ")}`);
    }

    response = await sendCommand(socket, "DATA");
    if (response.code !== 354) throw new Error(`SMTP DATA failed: ${response.lines.join(" ")}`);

    const message = buildMessage(params).replace(/\r?\n/g, "\r\n");
    socket.write(`${message}\r\n.\r\n`);
    response = await readResponse(socket);
    if (response.code !== 250) {
      throw new Error(`SMTP message rejected: ${response.lines.join(" ")}`);
    }

    await sendCommand(socket, "QUIT").catch(() => null);
    return { ok: true };
  } finally {
    socket.destroy();
  }
}

function renderTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? "");
}

export async function sendEmailTemplate(params: {
  organizationId: string;
  name: string;
  toEmail: string;
  variables?: Record<string, string>;
  sentById?: string | null;
}) {
  const template = await prisma.emailTemplate.findFirst({
    where: {
      organizationId: params.organizationId,
      name: params.name,
      active: true
    }
  });

  if (!template) {
    throw new Error(`Email template not found: ${params.name}`);
  }

  const variables = params.variables || {};
  const subject = renderTemplate(template.subject, variables);
  const htmlBody = renderTemplate(template.htmlBody, variables);
  const textBody = template.textBody ? renderTemplate(template.textBody, variables) : htmlBody.replace(/<[^>]*>/g, "");

  const log = await prisma.emailLog.create({
    data: {
      organizationId: params.organizationId,
      templateId: template.id,
      sentById: params.sentById || null,
      toEmail: params.toEmail.toLowerCase(),
      subject,
      body: htmlBody,
      status: "QUEUED",
      metadata: toJsonValue({ templateName: template.name, variables })
    }
  });

  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@revanta.local";
    const result = await sendSmtpEmail({
      from,
      to: params.toEmail,
      subject,
      text: textBody,
      html: htmlBody
    });

    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: "SENT",
        provider: "SMTP",
        sentAt: new Date(),
        metadata: toJsonValue({ templateName: template.name, variables, result })
      }
    });

    return { ok: true, template, logId: log.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email send failed";
    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        errorMessage: message,
        metadata: toJsonValue({ templateName: template.name, variables, error: message })
      }
    });
    throw error;
  }
}
