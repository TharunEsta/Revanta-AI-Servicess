import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest, hashPassword } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      memberships: {
        include: { organization: true, role: true }
      },
      sessions: true
    }
  });
  if (!user) return jsonError("Not found", 404);
  return jsonOk(user);
}

export async function PATCH(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = (await safeJson(request)) as Record<string, unknown>;
  const user = await prisma.user.update({
    where: { id },
    data: {
      name: typeof body.name === "string" ? body.name : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : undefined,
      status: typeof body.status === "string" ? (body.status as any) : undefined,
      passwordHash: typeof body.password === "string" ? await hashPassword(body.password) : undefined
    }
  });
  return jsonOk(user);
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  await prisma.user.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
