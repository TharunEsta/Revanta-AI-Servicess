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
  const milestones = await prisma.projectMilestone.findMany({
    where: { organizationId: session.orgId, projectId: id },
    include: { tasks: { include: { assignee: true } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
  return jsonOk(milestones);
}

export async function POST(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const project = await prisma.project.findFirst({ where: { id, organizationId: session.orgId } });
  if (!project) return jsonError("Not found", 404);
  const body = (await safeJson(request)) as Record<string, unknown>;

  const milestone = await prisma.projectMilestone.create({
    data: {
      organizationId: session.orgId,
      projectId: id,
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Milestone",
      description: typeof body.description === "string" ? body.description : null,
      status: typeof body.status === "string" ? (body.status as any) : "PLANNED",
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      dueAt: typeof body.dueAt === "string" ? new Date(body.dueAt) : null,
      metadata: body.metadata && typeof body.metadata === "object" ? toJsonValue(body.metadata) : undefined
    }
  });

  return jsonOk(milestone, { status: 201 });
}
