import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const record = await prisma.conversation.findFirst({
    where: { id, organizationId: session.orgId },
    include: {
      lead: true,
      company: true,
      contact: true,
      messages: {
        orderBy: { createdAt: "asc" },
        include: { attachments: true }
      }
    }
  });
  if (!record) return jsonError("Not found", 404);
  return jsonOk(record);
}

export async function PATCH(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = (await safeJson(request)) as Record<string, unknown>;
  const existing = await prisma.conversation.findFirst({
    where: { id, organizationId: session.orgId }
  });
  if (!existing) return jsonError("Not found", 404);
  const record = await prisma.conversation.update({
    where: { id },
    data: {
      status: typeof body.status === "string" ? (body.status as any) : undefined,
      assignedToId: typeof body.assignedToId === "string" ? body.assignedToId : undefined,
      subject: typeof body.subject === "string" ? body.subject : undefined,
      threadId: typeof body.threadId === "string" ? body.threadId : undefined,
      aiState: typeof body.aiState === "string" ? (body.aiState as any) : body.humanTakeover ? "HUMAN_ACTIVE" : undefined,
      humanTakeoverAt: body.humanTakeover === true ? new Date() : body.humanTakeover === false ? null : undefined
    }
  });
  return jsonOk(record);
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const existing = await prisma.conversation.findFirst({
    where: { id, organizationId: session.orgId }
  });
  if (!existing) return jsonError("Not found", 404);
  await prisma.conversation.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
