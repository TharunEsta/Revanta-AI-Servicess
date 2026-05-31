import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { createProjectFromWonDeal } from "@/lib/revanta-os/projects";
import { triggerWorkflowEvent } from "@/lib/revanta-os/workflows";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const records = await prisma.deal.findMany({
    where: { organizationId: session.orgId },
    include: { company: true, lead: true, owner: true },
    orderBy: { updatedAt: "desc" }
  });
  return jsonOk(records);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const record = await prisma.deal.create({
    data: {
      organizationId: session.orgId,
      title: typeof body.title === "string" ? body.title : "",
      companyId: typeof body.companyId === "string" ? body.companyId : null,
      leadId: typeof body.leadId === "string" ? body.leadId : null,
      ownerId: typeof body.ownerId === "string" ? body.ownerId : null,
      serviceType: typeof body.serviceType === "string" && body.serviceType.trim() ? body.serviceType.trim() : null,
      stage: typeof body.stage === "string" ? (body.stage as any) : "DISCOVERY",
      amount: typeof body.amount === "number" ? body.amount : undefined,
      currency: typeof body.currency === "string" ? body.currency : "USD",
      probability: typeof body.probability === "number" ? body.probability : 0,
      notes: typeof body.notes === "string" ? body.notes : null,
      closeDate: typeof body.closeDate === "string" ? new Date(body.closeDate) : null
    }
  });
  if (record.stage === "WON") {
    await createProjectFromWonDeal({
      organizationId: session.orgId,
      dealId: record.id,
      actorId: session.userId
    });
    await triggerWorkflowEvent({
      organizationId: session.orgId,
      actorId: session.userId,
      eventType: "DEAL_WON",
      payload: {
        dealId: record.id,
        leadId: record.leadId,
        companyId: record.companyId,
        title: record.title,
        amount: record.amount,
        currency: record.currency,
        stage: record.stage
      }
    });
  }
  return jsonOk(record, { status: 201 });
}
