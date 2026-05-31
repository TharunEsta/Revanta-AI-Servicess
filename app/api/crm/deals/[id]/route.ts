import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { createProjectFromWonDeal } from "@/lib/revanta-os/projects";
import { triggerWorkflowEvent } from "@/lib/revanta-os/workflows";

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const record = await prisma.deal.findFirst({
    where: { id, organizationId: session.orgId },
    include: { company: true, lead: true, owner: true, project: true }
  });
  if (!record) return jsonError("Not found", 404);
  return jsonOk(record);
}

export async function PATCH(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = (await safeJson(request)) as Record<string, unknown>;
  const existing = await prisma.deal.findFirst({ where: { id, organizationId: session.orgId } });
  if (!existing) return jsonError("Not found", 404);
  const record = await prisma.deal.update({
    where: { id },
    data: {
      title: typeof body.title === "string" ? body.title : undefined,
      companyId: typeof body.companyId === "string" ? body.companyId : undefined,
      leadId: typeof body.leadId === "string" ? body.leadId : undefined,
      ownerId: typeof body.ownerId === "string" ? body.ownerId : undefined,
      serviceType: typeof body.serviceType === "string" && body.serviceType.trim() ? body.serviceType.trim() : undefined,
      stage: typeof body.stage === "string" ? (body.stage as any) : undefined,
      amount: typeof body.amount === "number" ? body.amount : undefined,
      currency: typeof body.currency === "string" ? body.currency : undefined,
      probability: typeof body.probability === "number" ? body.probability : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      closeDate: typeof body.closeDate === "string" ? new Date(body.closeDate) : undefined
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
  return jsonOk(record);
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const existing = await prisma.deal.findFirst({ where: { id, organizationId: session.orgId } });
  if (!existing) return jsonError("Not found", 404);
  await prisma.deal.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
