import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const record = await prisma.company.findFirst({
    where: { id, organizationId: session.orgId },
    include: { leads: true, contacts: true, deals: true }
  });
  if (!record) return jsonError("Not found", 404);
  return jsonOk(record);
}

export async function PATCH(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = (await safeJson(request)) as Record<string, unknown>;
  const record = await prisma.company.update({
    where: { id },
    data: {
      name: typeof body.name === "string" ? body.name : undefined,
      website: typeof body.website === "string" ? body.website : undefined,
      email: typeof body.email === "string" ? body.email.toLowerCase() : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      linkedinUrl: typeof body.linkedinUrl === "string" ? body.linkedinUrl : undefined,
      industry: typeof body.industry === "string" ? body.industry : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined
    }
  });
  return jsonOk(record);
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  await prisma.company.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
