import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const records = await prisma.contact.findMany({
    where: { organizationId: session.orgId },
    include: { company: true, lead: true },
    orderBy: { updatedAt: "desc" }
  });
  return jsonOk(records);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const contact = await prisma.contact.create({
    data: {
      organizationId: session.orgId,
      companyId: typeof body.companyId === "string" ? body.companyId : null,
      leadId: typeof body.leadId === "string" ? body.leadId : null,
      firstName: typeof body.firstName === "string" ? body.firstName : null,
      lastName: typeof body.lastName === "string" ? body.lastName : null,
      fullName: typeof body.fullName === "string" ? body.fullName : null,
      email: typeof body.email === "string" ? body.email.toLowerCase() : null,
      phone: typeof body.phone === "string" ? body.phone : null,
      roleTitle: typeof body.roleTitle === "string" ? body.roleTitle : null,
      linkedinUrl: typeof body.linkedinUrl === "string" ? body.linkedinUrl : null,
      notes: typeof body.notes === "string" ? body.notes : null
    }
  });
  return jsonOk(contact, { status: 201 });
}

