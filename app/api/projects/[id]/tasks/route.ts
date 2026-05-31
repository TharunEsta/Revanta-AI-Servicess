import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { toJsonValue } from "@/lib/revanta-os/json";

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const project = await prisma.project.findFirst({ where: { id, organizationId: session.orgId } });
  if (!project) return jsonError("Not found", 404);
  const tasks = await prisma.task.findMany({
    where: { organizationId: session.orgId, projectId: id },
    include: { assignee: true, creator: true, milestone: true },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }]
  });
  return jsonOk(tasks);
}

export async function POST(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const project = await prisma.project.findFirst({ where: { id, organizationId: session.orgId } });
  if (!project) return jsonError("Not found", 404);
  const body = (await safeJson(request)) as Record<string, unknown>;

  const task = await prisma.task.create({
    data: {
      organizationId: session.orgId,
      projectId: id,
      milestoneId: typeof body.milestoneId === "string" && body.milestoneId.trim() ? body.milestoneId.trim() : null,
      creatorId: session.userId,
      assigneeId: typeof body.assigneeId === "string" && body.assigneeId.trim() ? body.assigneeId.trim() : null,
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Task",
      description: typeof body.description === "string" ? body.description : null,
      status: typeof body.status === "string" ? (body.status as any) : "OPEN",
      priority: typeof body.priority === "number" ? body.priority : 2,
      dueAt: typeof body.dueAt === "string" ? new Date(body.dueAt) : null
    }
  });

  await prisma.activity.create({
    data: {
      organizationId: session.orgId,
      actorId: session.userId,
      projectId: id,
      type: "TASK_CREATED",
      title: `Task created: ${task.title}`,
      body: task.description || null,
      metadata: toJsonValue({
        projectId: id,
        taskId: task.id,
        assigneeId: task.assigneeId
      })
    }
  });

  return jsonOk(task, { status: 201 });
}
