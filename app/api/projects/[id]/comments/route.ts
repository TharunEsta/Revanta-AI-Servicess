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
  const comments = await prisma.projectComment.findMany({
    where: { organizationId: session.orgId, projectId: id },
    include: { author: true },
    orderBy: { createdAt: "desc" }
  });
  return jsonOk(comments);
}

export async function POST(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const project = await prisma.project.findFirst({ where: { id, organizationId: session.orgId } });
  if (!project) return jsonError("Not found", 404);
  const body = (await safeJson(request)) as Record<string, unknown>;

  const comment = await prisma.projectComment.create({
    data: {
      organizationId: session.orgId,
      projectId: id,
      authorId: session.userId,
      body: typeof body.body === "string" && body.body.trim() ? body.body.trim() : "",
      internalOnly: body.internalOnly === false ? false : true,
      metadata: body.metadata && typeof body.metadata === "object" ? toJsonValue(body.metadata) : undefined
    }
  });

  await prisma.activity.create({
    data: {
      organizationId: session.orgId,
      actorId: session.userId,
      projectId: id,
      type: "PROJECT_COMMENT",
      title: `Project note added: ${project.name}`,
      body: comment.body,
      metadata: toJsonValue({ projectId: id, commentId: comment.id, internalOnly: comment.internalOnly })
    }
  });

  return jsonOk(comment, { status: 201 });
}
