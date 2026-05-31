import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk } from "@/lib/revanta-os/http";
import { getRevenueMetrics } from "@/lib/revanta-os/business";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const metrics = await getRevenueMetrics(session.orgId);
  return jsonOk(metrics);
}
