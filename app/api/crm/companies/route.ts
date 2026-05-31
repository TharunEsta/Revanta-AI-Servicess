import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const records = await prisma.company.findMany({
    where: { organizationId: session.orgId },
    include: { leads: true, contacts: true, deals: true },
    orderBy: { updatedAt: "desc" }
  });
  return jsonOk(records);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const record = await prisma.company.create({
    data: {
      organizationId: session.orgId,
      name: typeof body.name === "string" ? body.name : "",
      website: typeof body.website === "string" ? body.website : null,
      email: typeof body.email === "string" ? body.email.toLowerCase() : null,
      phone: typeof body.phone === "string" ? body.phone : null,
      linkedinUrl: typeof body.linkedinUrl === "string" ? body.linkedinUrl : null,
      industry: typeof body.industry === "string" ? body.industry : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      source: typeof body.source === "string" ? (body.source as any) : "MANUAL"
    }
  });
  return jsonOk(record, { status: 201 });
}

