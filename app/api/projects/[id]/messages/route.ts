import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { toJsonValue } from "@/lib/revanta-os/json";
import { triggerWorkflowEvent } from "@/lib/revanta-os/workflows";

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.orgId },
    include: {
      conversations: {
        include: { messages: { orderBy: { createdAt: "asc" } } },
        orderBy: { updatedAt: "desc" }
      }
    }
  });
  if (!project) return jsonError("Not found", 404);
  return jsonOk(project.conversations);
}

export async function POST(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.orgId },
    include: { conversations: { orderBy: { updatedAt: "desc" }, take: 1 } }
  });
  if (!project) return jsonError("Not found", 404);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const bodyText = typeof body.text === "string" ? body.text.trim() : "";
  if (!bodyText) return jsonError("text is required.");

  let conversation = project.conversations[0] || null;
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        organizationId: session.orgId,
        projectId: project.id,
        companyId: project.companyId || null,
        leadId: project.leadId || null,
        assignedToId: project.ownerId || session.userId,
        channel: "WEB",
        status: "OPEN",
        subject: `${project.name} client thread`,
        startedAt: new Date(),
        lastMessageAt: new Date(),
        metadata: toJsonValue({ source: "project-messages" })
      }
    });
  }

  const message = await prisma.message.create({
    data: {
      organizationId: session.orgId,
      conversationId: conversation.id,
      leadId: project.leadId || null,
      direction: body.direction === "OUTBOUND" ? "OUTBOUND" : "INBOUND",
      body: bodyText,
      status: "sent",
      sentAt: new Date(),
      metadata: toJsonValue({
        projectId: project.id,
        sender: typeof body.sender === "string" ? body.sender : "client-portal"
      })
    }
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      status: "OPEN"
    }
  });

  await prisma.activity.create({
    data: {
      organizationId: session.orgId,
      actorId: session.userId,
      projectId: project.id,
      type: "PROJECT_MESSAGE",
      title: `Project message for ${project.name}`,
      body: bodyText,
      metadata: toJsonValue({ projectId: project.id, conversationId: conversation.id, messageId: message.id })
    }
  });

  const eventType = body.direction === "OUTBOUND" ? "PROJECT_UPDATED" : "MESSAGE_RECEIVED";
  await triggerWorkflowEvent({
    organizationId: session.orgId,
    actorId: session.userId,
    eventType,
    payload: {
      projectId: project.id,
      conversationId: conversation.id,
      messageId: message.id,
      text: bodyText,
      direction: body.direction === "OUTBOUND" ? "OUTBOUND" : "INBOUND"
    }
  });

  return jsonOk({ conversationId: conversation.id, message });
}
