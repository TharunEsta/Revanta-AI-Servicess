import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await context.params;

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      memberships: {
        include: { user: true, role: true }
      },
      roles: true
    }
  });
  if (!organization) return jsonError("Not found", 404);
  return jsonOk(organization);
}

export async function PATCH(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = (await safeJson(request)) as Record<string, unknown>;
  const organization = await prisma.organization.update({
    where: { id },
    data: {
      name: typeof body.name === "string" ? body.name.trim() : undefined,
      domain: typeof body.domain === "string" ? body.domain : undefined,
      logoUrl: typeof body.logoUrl === "string" ? body.logoUrl : undefined,
      timezone: typeof body.timezone === "string" ? body.timezone : undefined,
      settings: body.settings && typeof body.settings === "object" ? (body.settings as object) : undefined
    }
  });
  return jsonOk(organization);
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  await prisma.organization.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
