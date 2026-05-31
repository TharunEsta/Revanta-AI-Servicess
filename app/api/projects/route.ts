import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { createProjectFromWonDeal, ensureServiceCatalog } from "@/lib/revanta-os/projects";
import { toJsonValue } from "@/lib/revanta-os/json";
import { triggerWorkflowEvent } from "@/lib/revanta-os/workflows";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);

  const records = await prisma.project.findMany({
    where: { organizationId: session.orgId },
    include: {
      deal: true,
      owner: true,
      lead: true,
      company: true,
      serviceCatalogItem: true,
      milestones: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 4 },
      tasks: { orderBy: { createdAt: "desc" }, take: 4, include: { assignee: true, milestone: true } },
      conversations: { include: { messages: { orderBy: { createdAt: "desc" }, take: 3 } }, orderBy: { updatedAt: "desc" } },
      comments: { include: { author: true }, orderBy: { createdAt: "desc" }, take: 4 },
      attachments: { orderBy: { createdAt: "desc" }, take: 4 }
    },
    orderBy: { updatedAt: "desc" }
  });

  return jsonOk(records);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);

  const body = (await safeJson(request)) as Record<string, unknown>;
  const dealId = typeof body.dealId === "string" ? body.dealId : null;

  if (dealId) {
    const project = await createProjectFromWonDeal({
      organizationId: session.orgId,
      dealId,
      actorId: session.userId
    });
    return jsonOk(project, { status: 201 });
  }

  await ensureServiceCatalog(session.orgId);
  const project = await prisma.project.create({
    data: {
      organizationId: session.orgId,
      name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : "New project",
      serviceType: typeof body.serviceType === "string" && body.serviceType.trim() ? body.serviceType.trim() : undefined,
      serviceCatalogItemId:
        typeof body.serviceCatalogItemId === "string" && body.serviceCatalogItemId.trim() ? body.serviceCatalogItemId.trim() : undefined,
      summary: typeof body.summary === "string" && body.summary.trim() ? body.summary.trim() : undefined,
      requirements: typeof body.requirements === "string" && body.requirements.trim() ? body.requirements.trim() : undefined,
      requirementsSummary:
        typeof body.requirementsSummary === "string" && body.requirementsSummary.trim() ? body.requirementsSummary.trim() : undefined,
      status: typeof body.status === "string" ? (body.status as any) : "PLANNED",
      deliveryStage: typeof body.deliveryStage === "string" ? (body.deliveryStage as any) : "DISCOVERY",
      ownerId: typeof body.ownerId === "string" && body.ownerId.trim() ? body.ownerId.trim() : undefined,
      leadId: typeof body.leadId === "string" && body.leadId.trim() ? body.leadId.trim() : undefined,
      companyId: typeof body.companyId === "string" && body.companyId.trim() ? body.companyId.trim() : undefined,
      repositoryUrl: typeof body.repositoryUrl === "string" && body.repositoryUrl.trim() ? body.repositoryUrl.trim() : undefined,
      deploymentUrl: typeof body.deploymentUrl === "string" && body.deploymentUrl.trim() ? body.deploymentUrl.trim() : undefined,
      environmentStatus:
        typeof body.environmentStatus === "string" && body.environmentStatus.trim() ? body.environmentStatus.trim() : "PLANNED",
      serverDetails: body.serverDetails && typeof body.serverDetails === "object" ? toJsonValue(body.serverDetails) : undefined,
      versionHistory: body.versionHistory && typeof body.versionHistory === "object" ? toJsonValue(body.versionHistory) : undefined,
      aiPlan: body.aiPlan && typeof body.aiPlan === "object" ? toJsonValue(body.aiPlan) : undefined,
      proposalSummary: body.proposalSummary && typeof body.proposalSummary === "object" ? toJsonValue(body.proposalSummary) : undefined,
      blockers: body.blockers && typeof body.blockers === "object" ? toJsonValue(body.blockers) : undefined,
      complexityScore: typeof body.complexityScore === "number" ? body.complexityScore : undefined,
      estimatedHours: typeof body.estimatedHours === "number" ? body.estimatedHours : undefined
    }
  });

  await prisma.projectMember.create({
    data: {
      organizationId: session.orgId,
      projectId: project.id,
      userId: session.userId,
      role: "Owner",
      allocationPct: 100
    }
  });

  await prisma.activity.create({
    data: {
      organizationId: session.orgId,
      actorId: session.userId,
      projectId: project.id,
      type: "PROJECT_CREATED",
      title: `Project created: ${project.name}`,
      body: project.summary || project.requirements || null,
      metadata: toJsonValue({ projectId: project.id, serviceType: project.serviceType })
    }
  });

  await triggerWorkflowEvent({
    organizationId: session.orgId,
    actorId: session.userId,
    eventType: "PROJECT_CREATED",
    payload: {
      projectId: project.id,
      projectName: project.name,
      serviceType: project.serviceType,
      status: project.status
    }
  });

  return jsonOk(project, { status: 201 });
}
