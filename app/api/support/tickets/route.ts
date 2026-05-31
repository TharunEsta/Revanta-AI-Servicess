import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { createSupportTicket } from "@/lib/revanta-os/business";
import { toJsonValue } from "@/lib/revanta-os/json";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const tickets = await prisma.supportTicket.findMany({
    where: { organizationId: session.orgId },
    include: { project: true, company: true, lead: true, contact: true, assignee: true, reporter: true, messages: { include: { author: true } } },
    orderBy: { updatedAt: "desc" }
  });
  return jsonOk(tickets);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const subject = typeof body.subject === "string" ? body.subject : "";
  if (!subject) return jsonError("subject is required.");

  const ticket = await createSupportTicket({
    organizationId: session.orgId,
    userId: session.userId,
    leadId: typeof body.leadId === "string" ? body.leadId : null,
    companyId: typeof body.companyId === "string" ? body.companyId : null,
    projectId: typeof body.projectId === "string" ? body.projectId : null,
    contactId: typeof body.contactId === "string" ? body.contactId : null,
    subject,
    description: typeof body.description === "string" ? body.description : null,
    type: typeof body.type === "string" ? (body.type as any) : "ISSUE",
    priority: typeof body.priority === "string" ? (body.priority as any) : "MEDIUM"
  });

  if (typeof body.message === "string" && body.message.trim()) {
    await prisma.supportTicketMessage.create({
      data: {
        organizationId: session.orgId,
        ticketId: ticket.id,
        authorId: session.userId,
        body: body.message.trim(),
        isInternal: false,
        metadata: toJsonValue({ source: "ticket-create" })
      }
    });
  }

  return jsonOk(ticket, { status: 201 });
}
