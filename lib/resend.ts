import { siteConfig } from "@/content/site";

type ResendEmailPayload = {
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

function getEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatMessageAsHtml(message: string) {
  return escapeHtml(message).replace(/\n/g, "<br />");
}

export async function sendBusinessEmail(payload: ResendEmailPayload) {
  const resendApiKey = getEnv("RESEND_API_KEY");
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const to = getEnv("FORMS_NOTIFICATION_TO_EMAIL") || siteConfig.salesEmail;
  const from =
    getEnv("FORMS_NOTIFICATION_FROM_EMAIL") || "Revanta AI <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      reply_to: payload.replyTo ? [payload.replyTo] : undefined
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Resend request failed.");
  }
}
