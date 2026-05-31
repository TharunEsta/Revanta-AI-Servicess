import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { createNotification, listNotifications } from "@/lib/revanta-os/notifications";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const notifications = await listNotifications(session.orgId, session.userId, 100);
  return jsonOk(notifications);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "SYSTEM";
  if (!title || !text) return jsonError("title and body are required.");
  const record = await createNotification({
    organizationId: session.orgId,
    userId: typeof body.userId === "string" ? body.userId : session.userId,
    type,
    title,
    body: text,
    link: typeof body.link === "string" ? body.link : null,
    metadata: body.metadata && typeof body.metadata === "object" ? (body.metadata as Record<string, unknown>) : null
  });
  return jsonOk(record, { status: 201 });
}

