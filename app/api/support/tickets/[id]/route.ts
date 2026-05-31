import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { toJsonValue } from "@/lib/revanta-os/json";

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const ticket = await prisma.supportTicket.findFirst({
    where: { id, organizationId: session.orgId },
    include: { project: true, company: true, lead: true, contact: true, assignee: true, reporter: true, messages: { include: { author: true }, orderBy: { createdAt: "asc" } } }
  });
  if (!ticket) return jsonError("Not found", 404);
  return jsonOk(ticket);
}

export async function PATCH(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = (await safeJson(request)) as Record<string, unknown>;
  const ticket = await prisma.supportTicket.findFirst({ where: { id, organizationId: session.orgId } });
  if (!ticket) return jsonError("Not found", 404);

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: {
      status: typeof body.status === "string" ? (body.status as any) : undefined,
      priority: typeof body.priority === "string" ? (body.priority as any) : undefined,
      assigneeId: typeof body.assigneeId === "string" ? body.assigneeId : undefined,
      resolution: typeof body.resolution === "string" ? body.resolution : undefined,
      dueAt: typeof body.dueAt === "string" ? new Date(body.dueAt) : undefined,
      resolvedAt: body.resolved === true ? new Date() : undefined,
      closedAt: body.closed === true ? new Date() : undefined,
      metadata: body.metadata && typeof body.metadata === "object" ? toJsonValue(body.metadata) : undefined
    }
  });

  await prisma.activity.create({
    data: {
      organizationId: session.orgId,
      actorId: session.userId,
      projectId: updated.projectId || undefined,
      leadId: updated.leadId || undefined,
      companyId: updated.companyId || undefined,
      type: "TICKET_UPDATED",
      title: `Support ticket updated: ${updated.subject}`,
      body: updated.status,
      metadata: toJsonValue({ ticketId: updated.id, status: updated.status, priority: updated.priority })
    }
  });

  return jsonOk(updated);
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const ticket = await prisma.supportTicket.findFirst({ where: { id, organizationId: session.orgId } });
  if (!ticket) return jsonError("Not found", 404);
  await prisma.supportTicket.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
