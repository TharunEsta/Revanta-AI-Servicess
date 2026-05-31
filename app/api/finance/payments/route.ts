import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { recordPayment } from "@/lib/revanta-os/business";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const payments = await prisma.payment.findMany({
    where: { organizationId: session.orgId },
    include: { invoice: true, recordedBy: true },
    orderBy: { createdAt: "desc" }
  });
  return jsonOk(payments);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const invoiceId = typeof body.invoiceId === "string" ? body.invoiceId : "";
  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount || 0);
  const provider = typeof body.provider === "string" ? body.provider : "";
  if (!invoiceId || !amount || !provider) return jsonError("invoiceId, amount, and provider are required.");

  const payment = await recordPayment({
    organizationId: session.orgId,
    invoiceId,
    amount,
    provider,
    providerRef: typeof body.providerRef === "string" ? body.providerRef : null,
    userId: session.userId,
    metadata: body.metadata && typeof body.metadata === "object" ? (body.metadata as Record<string, unknown>) : null
  });

  return jsonOk(payment, { status: 201 });
}
