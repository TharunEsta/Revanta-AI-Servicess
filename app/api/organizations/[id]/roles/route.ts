import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const roles = await prisma.role.findMany({
    where: { organizationId: id },
    include: { permissions: { include: { permission: true } } }
  });
  return jsonOk(roles);
}

export async function POST(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = (await safeJson(request)) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return jsonError("Role name is required.");
  const role = await prisma.role.create({
    data: {
      organizationId: id,
      name,
      scope: "ORG",
      description: typeof body.description === "string" ? body.description : null
    }
  });
  return jsonOk(role, { status: 201 });
}
