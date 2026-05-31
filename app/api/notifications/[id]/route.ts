import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { markNotificationRead } from "@/lib/revanta-os/notifications";
import { jsonError, jsonOk } from "@/lib/revanta-os/http";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const updated = await markNotificationRead(session.orgId, id, session.userId);
  return jsonOk(updated);
}

