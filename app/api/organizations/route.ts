import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        include: { user: true, role: true }
      }
    }
  });
  return jsonOk(organizations);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  if (!name || !slug) return jsonError("Name and slug are required.");

  const organization = await prisma.organization.create({
    data: {
      name,
      slug,
      domain: typeof body.domain === "string" ? body.domain : null,
      settings: body.settings && typeof body.settings === "object" ? (body.settings as object) : {}
    }
  });

  return jsonOk(organization, { status: 201 });
}

