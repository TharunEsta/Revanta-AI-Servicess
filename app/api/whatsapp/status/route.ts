import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { getWhatsAppMetrics, recordWhatsAppStatusUpdate } from "@/lib/revanta-os/whatsapp";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const metrics = await getWhatsAppMetrics(session.orgId);
  return jsonOk(metrics);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const externalMessageId = typeof body.externalMessageId === "string" ? body.externalMessageId : "";
  const status = typeof body.status === "string" ? body.status : "";
  if (!externalMessageId || !status) {
    return jsonError("externalMessageId and status are required.");
  }

  const updated = await recordWhatsAppStatusUpdate({
    organizationId: session.orgId,
    externalMessageId,
    status,
    timestamp: typeof body.timestamp === "string" ? new Date(body.timestamp) : new Date()
  });

  if (!updated) {
    return jsonError("Message not found", 404);
  }

  return jsonOk(updated);
}
