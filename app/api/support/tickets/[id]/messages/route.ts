import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { toJsonValue } from "@/lib/revanta-os/json";

export async function POST(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const ticket = await prisma.supportTicket.findFirst({ where: { id, organizationId: session.orgId } });
  if (!ticket) return jsonError("Not found", 404);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return jsonError("text is required.");

  const message = await prisma.supportTicketMessage.create({
    data: {
      organizationId: session.orgId,
      ticketId: ticket.id,
      authorId: session.userId,
      body: text,
      isInternal: body.isInternal === true,
      metadata: toJsonValue({ source: "ticket-message" })
    }
  });

  return jsonOk(message, { status: 201 });
}
