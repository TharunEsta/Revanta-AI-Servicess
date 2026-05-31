import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { toJsonValue } from "@/lib/revanta-os/json";
import { triggerWorkflowEvent } from "@/lib/revanta-os/workflows";

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const record = await prisma.project.findFirst({
    where: { id, organizationId: session.orgId },
    include: {
      deal: true,
      owner: true,
      lead: true,
      company: true,
      serviceCatalogItem: true,
      tasks: { include: { assignee: true, creator: true, milestone: true }, orderBy: { createdAt: "desc" } },
      milestones: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
      conversations: { include: { messages: { orderBy: { createdAt: "desc" }, take: 25 } }, orderBy: { updatedAt: "desc" } },
      attachments: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 50 }
    }
  });
  if (!record) return jsonError("Not found", 404);
  return jsonOk(record);
}

export async function PATCH(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = (await safeJson(request)) as Record<string, unknown>;
  const existing = await prisma.project.findFirst({ where: { id, organizationId: session.orgId } });
  if (!existing) return jsonError("Not found", 404);

  const record = await prisma.project.update({
    where: { id },
    data: {
      name: typeof body.name === "string" ? body.name : undefined,
      serviceType: typeof body.serviceType === "string" && body.serviceType.trim() ? body.serviceType.trim() : undefined,
      serviceCatalogItemId:
        typeof body.serviceCatalogItemId === "string" && body.serviceCatalogItemId.trim() ? body.serviceCatalogItemId.trim() : undefined,
      status: typeof body.status === "string" ? (body.status as any) : undefined,
      deliveryStage: typeof body.deliveryStage === "string" ? (body.deliveryStage as any) : undefined,
      summary: typeof body.summary === "string" && body.summary.trim() ? body.summary.trim() : undefined,
      requirements: typeof body.requirements === "string" && body.requirements.trim() ? body.requirements.trim() : undefined,
      requirementsSummary:
        typeof body.requirementsSummary === "string" && body.requirementsSummary.trim() ? body.requirementsSummary.trim() : undefined,
      ownerId: typeof body.ownerId === "string" && body.ownerId.trim() ? body.ownerId.trim() : undefined,
      leadId: typeof body.leadId === "string" && body.leadId.trim() ? body.leadId.trim() : undefined,
      companyId: typeof body.companyId === "string" && body.companyId.trim() ? body.companyId.trim() : undefined,
      repositoryUrl: typeof body.repositoryUrl === "string" && body.repositoryUrl.trim() ? body.repositoryUrl.trim() : undefined,
      deploymentUrl: typeof body.deploymentUrl === "string" && body.deploymentUrl.trim() ? body.deploymentUrl.trim() : undefined,
      environmentStatus: typeof body.environmentStatus === "string" && body.environmentStatus.trim() ? body.environmentStatus.trim() : undefined,
      serverDetails: body.serverDetails && typeof body.serverDetails === "object" ? toJsonValue(body.serverDetails) : undefined,
      versionHistory: body.versionHistory && typeof body.versionHistory === "object" ? toJsonValue(body.versionHistory) : undefined,
      aiPlan: body.aiPlan && typeof body.aiPlan === "object" ? toJsonValue(body.aiPlan) : undefined,
      proposalSummary: body.proposalSummary && typeof body.proposalSummary === "object" ? toJsonValue(body.proposalSummary) : undefined,
      blockers: body.blockers && typeof body.blockers === "object" ? toJsonValue(body.blockers) : undefined,
      complexityScore: typeof body.complexityScore === "number" ? body.complexityScore : undefined,
      estimatedHours: typeof body.estimatedHours === "number" ? body.estimatedHours : undefined,
      clientSatisfaction: typeof body.clientSatisfaction === "number" ? body.clientSatisfaction : undefined,
      startDate: typeof body.startDate === "string" ? new Date(body.startDate) : undefined,
      endDate: typeof body.endDate === "string" ? new Date(body.endDate) : undefined
    }
  });

  await prisma.activity.create({
    data: {
      organizationId: session.orgId,
      actorId: session.userId,
      projectId: record.id,
      type: "PROJECT_UPDATED",
      title: `Project updated: ${record.name}`,
      body: typeof body.summary === "string" ? body.summary : null,
      metadata: toJsonValue({ fields: Object.keys(body), projectId: record.id })
    }
  });

  await triggerWorkflowEvent({
    organizationId: session.orgId,
    actorId: session.userId,
    eventType: "PROJECT_UPDATED",
    payload: {
      projectId: record.id,
      projectName: record.name,
      status: record.status,
      deliveryStage: record.deliveryStage
    }
  });

  return jsonOk(record);
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const existing = await prisma.project.findFirst({ where: { id, organizationId: session.orgId } });
  if (!existing) return jsonError("Not found", 404);
  await prisma.project.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
