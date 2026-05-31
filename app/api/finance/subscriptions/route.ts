import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { toJsonValue } from "@/lib/revanta-os/json";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const subscriptions = await prisma.subscription.findMany({
    where: { organizationId: session.orgId },
    include: { plan: true },
    orderBy: { createdAt: "desc" }
  });
  return jsonOk(subscriptions);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const planId = typeof body.planId === "string" ? body.planId : "";
  if (!planId) return jsonError("planId is required.");

  const subscription = await prisma.subscription.create({
    data: {
      organizationId: session.orgId,
      planId,
      status: typeof body.status === "string" ? (body.status as any) : "TRIALING",
      billingCycle: typeof body.billingCycle === "string" ? body.billingCycle : "MONTHLY",
      startsAt: typeof body.startsAt === "string" ? new Date(body.startsAt) : new Date(),
      endsAt: typeof body.endsAt === "string" ? new Date(body.endsAt) : undefined,
      trialEndsAt: typeof body.trialEndsAt === "string" ? new Date(body.trialEndsAt) : undefined,
      nextBillingAt: typeof body.nextBillingAt === "string" ? new Date(body.nextBillingAt) : undefined,
      cancelAt: typeof body.cancelAt === "string" ? new Date(body.cancelAt) : undefined,
      metadata: body.metadata && typeof body.metadata === "object" ? toJsonValue(body.metadata) : undefined
    },
    include: { plan: true }
  });

  return jsonOk(subscription, { status: 201 });
}
