import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { getDashboardSummary } from "@/lib/revanta-os/dashboard";
import { jsonError, jsonOk } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const summary = await getDashboardSummary(session.orgId);
  return jsonOk(summary);
}

