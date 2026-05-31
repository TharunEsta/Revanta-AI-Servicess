import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { toJsonValue } from "@/lib/revanta-os/json";

export async function PATCH(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id, taskId } = await context.params;
  const existing = await prisma.task.findFirst({ where: { id: taskId, organizationId: session.orgId, projectId: id } });
  if (!existing) return jsonError("Not found", 404);
  const body = (await safeJson(request)) as Record<string, unknown>;

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: typeof body.title === "string" ? body.title : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      status: typeof body.status === "string" ? (body.status as any) : undefined,
      priority: typeof body.priority === "number" ? body.priority : undefined,
      dueAt: typeof body.dueAt === "string" ? new Date(body.dueAt) : undefined,
      completedAt: body.completed === true ? new Date() : body.completed === false ? null : undefined,
      assigneeId: typeof body.assigneeId === "string" && body.assigneeId.trim() ? body.assigneeId.trim() : undefined,
      milestoneId: typeof body.milestoneId === "string" && body.milestoneId.trim() ? body.milestoneId.trim() : undefined
    }
  });

  await prisma.activity.create({
    data: {
      organizationId: session.orgId,
      actorId: session.userId,
      projectId: id,
      type: "TASK_UPDATED",
      title: `Task updated: ${task.title}`,
      body: task.status === "COMPLETED" ? "Task marked complete" : `Task status set to ${task.status}`,
      metadata: toJsonValue({
        projectId: id,
        taskId: task.id,
        status: task.status
      })
    }
  });

  return jsonOk(task);
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id, taskId } = await context.params;
  const existing = await prisma.task.findFirst({ where: { id: taskId, organizationId: session.orgId, projectId: id } });
  if (!existing) return jsonError("Not found", 404);
  await prisma.task.delete({ where: { id: taskId } });
  return jsonOk({ deleted: true });
}
