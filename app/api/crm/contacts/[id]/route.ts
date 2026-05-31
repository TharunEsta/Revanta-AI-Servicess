import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const record = await prisma.contact.findFirst({
    where: { id, organizationId: session.orgId },
    include: { company: true, lead: true }
  });
  if (!record) return jsonError("Not found", 404);
  return jsonOk(record);
}

export async function PATCH(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = (await safeJson(request)) as Record<string, unknown>;
  const existing = await prisma.contact.findFirst({ where: { id, organizationId: session.orgId } });
  if (!existing) return jsonError("Not found", 404);
  const record = await prisma.contact.update({
    where: { id },
    data: {
      firstName: typeof body.firstName === "string" ? body.firstName : undefined,
      lastName: typeof body.lastName === "string" ? body.lastName : undefined,
      fullName: typeof body.fullName === "string" ? body.fullName : undefined,
      email: typeof body.email === "string" ? body.email.toLowerCase() : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      roleTitle: typeof body.roleTitle === "string" ? body.roleTitle : undefined,
      linkedinUrl: typeof body.linkedinUrl === "string" ? body.linkedinUrl : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      companyId: typeof body.companyId === "string" ? body.companyId : undefined
    }
  });
  return jsonOk(record);
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const existing = await prisma.contact.findFirst({ where: { id, organizationId: session.orgId } });
  if (!existing) return jsonError("Not found", 404);
  await prisma.contact.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
