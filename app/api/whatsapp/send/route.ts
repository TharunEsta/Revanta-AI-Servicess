import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { sendWhatsAppMediaMessage, sendWhatsAppTextMessage } from "@/lib/revanta-os/whatsapp";

const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "video/mp4",
  "audio/mpeg"
]);

const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "pdf", "docx", "xlsx", "pptx", "mp4", "mp3"]);

function getExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

async function fileToDataUrl(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${file.type || "application/octet-stream"};base64,${bytes.toString("base64")}`;
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const conversationId = typeof formData.get("conversationId") === "string" ? String(formData.get("conversationId")) : "";
    const text = typeof formData.get("text") === "string" ? String(formData.get("text")) : "";
    const file = formData.get("file");
    if (!conversationId || !(file instanceof File)) {
      return jsonError("conversationId and file are required.");
    }
    const extension = getExtension(file.name);
    if (!ACCEPTED_EXTENSIONS.has(extension) || !ACCEPTED_MIME_TYPES.has(file.type)) {
      return jsonError("Unsupported file type.", 415);
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, organizationId: session.orgId }
    });
    if (!conversation) return jsonError("Conversation not found.", 404);
    if (conversation.aiState !== "HUMAN_ACTIVE") {
      return jsonError("Take control before sending human WhatsApp messages.", 409);
    }

    try {
      const result = await sendWhatsAppMediaMessage({
        organizationId: session.orgId,
        conversationId,
        file,
        caption: text,
        mediaUrl: await fileToDataUrl(file),
        metadata: { source: "HUMAN", sentBy: session.userId }
      });
      return jsonOk({ sent: true, messageId: result.message.id, externalMessageId: result.externalMessageId });
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "WhatsApp media send failed", 503);
    }
  }

  const body = (await safeJson(request)) as Record<string, unknown>;
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  const text = typeof body.text === "string" ? body.text : "";
  if (!conversationId || !text) return jsonError("conversationId and text are required.");

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, organizationId: session.orgId }
  });
  if (!conversation) return jsonError("Conversation not found.", 404);
  if (conversation.aiState !== "HUMAN_ACTIVE") {
    return jsonError("Take control before sending human WhatsApp messages.", 409);
  }

  try {
    const result = await sendWhatsAppTextMessage({
      organizationId: session.orgId,
      conversationId,
      text,
      metadata: { source: "HUMAN", sentBy: session.userId }
    });
    return jsonOk({ sent: true, messageId: result.message.id, externalMessageId: result.externalMessageId });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "WhatsApp send failed", 503);
  }
}
