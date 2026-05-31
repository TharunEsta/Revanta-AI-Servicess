import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { toJsonValue } from "@/lib/revanta-os/json";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const expenses = await prisma.expense.findMany({
    where: { organizationId: session.orgId },
    include: { project: true },
    orderBy: { incurredAt: "desc" }
  });
  return jsonOk(expenses);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title : "";
  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount || 0);
  const category = typeof body.category === "string" ? body.category : "Operational";
  if (!title || !amount) return jsonError("title and amount are required.");

  const expense = await prisma.expense.create({
    data: {
      organizationId: session.orgId,
      projectId: typeof body.projectId === "string" ? body.projectId : undefined,
      category,
      title,
      vendor: typeof body.vendor === "string" ? body.vendor : undefined,
      amount,
      currency: typeof body.currency === "string" ? body.currency : "USD",
      incurredAt: typeof body.incurredAt === "string" ? new Date(body.incurredAt) : new Date(),
      paidAt: typeof body.paidAt === "string" ? new Date(body.paidAt) : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      metadata: body.metadata && typeof body.metadata === "object" ? toJsonValue(body.metadata) : undefined
    }
  });

  return jsonOk(expense, { status: 201 });
}
