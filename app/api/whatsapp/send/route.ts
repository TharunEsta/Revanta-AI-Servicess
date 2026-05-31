import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { sendWhatsAppTextMessage } from "@/lib/revanta-os/whatsapp";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  const text = typeof body.text === "string" ? body.text : "";
  if (!conversationId || !text) return jsonError("conversationId and text are required.");

  try {
    const result = await sendWhatsAppTextMessage({
      organizationId: session.orgId,
      conversationId,
      text
    });
    return jsonOk({ sent: true, messageId: result.message.id, externalMessageId: result.externalMessageId });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "WhatsApp send failed", 503);
  }
}
