import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const templates = await prisma.emailTemplate.findMany({
    where: { organizationId: session.orgId },
    orderBy: { updatedAt: "desc" }
  });
  return jsonOk(templates);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const htmlBody = typeof body.htmlBody === "string" ? body.htmlBody.trim() : "";
  if (!name || !subject || !htmlBody) return jsonError("name, subject, and htmlBody are required.");
  const template = await prisma.emailTemplate.create({
    data: {
      organizationId: session.orgId,
      createdById: session.userId,
      name,
      subject,
      htmlBody,
      textBody: typeof body.textBody === "string" ? body.textBody : null,
      active: body.active !== false,
      metadata: body.metadata && typeof body.metadata === "object" ? (body.metadata as object) : undefined
    }
  });
  return jsonOk(template, { status: 201 });
}

