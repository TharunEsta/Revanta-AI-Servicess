import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const records = await prisma.conversation.findMany({
    where: { organizationId: session.orgId },
    include: { lead: true, company: true, contact: true, messages: { take: 25, orderBy: { createdAt: "desc" } } },
    orderBy: { updatedAt: "desc" }
  });
  return jsonOk(records);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const record = await prisma.conversation.create({
    data: {
      organizationId: session.orgId,
      leadId: typeof body.leadId === "string" ? body.leadId : null,
      companyId: typeof body.companyId === "string" ? body.companyId : null,
      contactId: typeof body.contactId === "string" ? body.contactId : null,
      channel: typeof body.channel === "string" ? (body.channel as any) : "WHATSAPP",
      status: typeof body.status === "string" ? (body.status as any) : "OPEN",
      aiState: typeof body.aiState === "string" ? (body.aiState as any) : undefined,
      subject: typeof body.subject === "string" ? body.subject : null,
      externalId: typeof body.externalId === "string" ? body.externalId : null,
      threadId: typeof body.threadId === "string" ? body.threadId : null,
      metadata: body.metadata && typeof body.metadata === "object" ? (body.metadata as object) : undefined
    }
  });
  return jsonOk(record, { status: 201 });
}
