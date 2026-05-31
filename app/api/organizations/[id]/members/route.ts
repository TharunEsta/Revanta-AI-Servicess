import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const members = await prisma.membership.findMany({
    where: { organizationId: id },
    include: { user: true, role: true }
  });
  return jsonOk(members);
}

export async function POST(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = (await safeJson(request)) as Record<string, unknown>;
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) return jsonError("userId is required.");
  const membership = await prisma.membership.upsert({
    where: { organizationId_userId: { organizationId: id, userId } },
    create: {
      organizationId: id,
      userId,
      roleId: typeof body.roleId === "string" ? body.roleId : null,
      title: typeof body.title === "string" ? body.title : null,
      status: "ACTIVE"
    },
    update: {
      roleId: typeof body.roleId === "string" ? body.roleId : null,
      title: typeof body.title === "string" ? body.title : null,
      status: typeof body.status === "string" ? (body.status as any) : undefined
    },
    include: { user: true, role: true }
  });
  return jsonOk(membership, { status: 201 });
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = (await safeJson(request)) as Record<string, unknown>;
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) return jsonError("userId is required.");
  await prisma.membership.delete({
    where: { organizationId_userId: { organizationId: id, userId } }
  });
  return jsonOk({ deleted: true });
}
