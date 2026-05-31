import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { toJsonValue } from "@/lib/revanta-os/json";
import { triggerWorkflowEvent } from "@/lib/revanta-os/workflows";

export async function PATCH(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id, milestoneId } = await context.params;
  const existing = await prisma.projectMilestone.findFirst({
    where: { id: milestoneId, organizationId: session.orgId, projectId: id }
  });
  if (!existing) return jsonError("Not found", 404);
  const body = (await safeJson(request)) as Record<string, unknown>;

  const milestone = await prisma.projectMilestone.update({
    where: { id: milestoneId },
    data: {
      title: typeof body.title === "string" ? body.title : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      status: typeof body.status === "string" ? (body.status as any) : undefined,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
      dueAt: typeof body.dueAt === "string" ? new Date(body.dueAt) : undefined,
      approvedAt: body.approved === true ? new Date() : body.approved === false ? null : undefined,
      metadata: body.metadata && typeof body.metadata === "object" ? toJsonValue(body.metadata) : undefined
    }
  });

  await prisma.activity.create({
    data: {
      organizationId: session.orgId,
      actorId: session.userId,
      projectId: id,
      type: "MILESTONE_UPDATED",
      title: `Milestone updated: ${milestone.title}`,
      body: milestone.status === "APPROVED" ? "Milestone approved" : `Milestone status set to ${milestone.status}`,
      metadata: toJsonValue({
        projectId: id,
        milestoneId: milestone.id,
        status: milestone.status
      })
    }
  });

  if (body.approved === true || milestone.status === "APPROVED") {
    await triggerWorkflowEvent({
      organizationId: session.orgId,
      actorId: session.userId,
      eventType: "MILESTONE_APPROVED",
      payload: {
        projectId: id,
        milestoneId: milestone.id,
        milestoneTitle: milestone.title
      }
    });
  }

  return jsonOk(milestone);
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id, milestoneId } = await context.params;
  const existing = await prisma.projectMilestone.findFirst({
    where: { id: milestoneId, organizationId: session.orgId, projectId: id }
  });
  if (!existing) return jsonError("Not found", 404);
  await prisma.projectMilestone.delete({ where: { id: milestoneId } });
  return jsonOk({ deleted: true });
}
