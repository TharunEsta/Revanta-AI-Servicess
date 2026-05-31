import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);

  const records = await prisma.companyKnowledge.findMany({
    where: { organizationId: session.orgId },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
  });

  return jsonOk(records);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);

  const body = (await safeJson(request)) as Record<string, unknown>;
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!category || !title || !content) {
    return jsonError("category, title, and content are required.");
  }

  const record = await prisma.companyKnowledge.create({
    data: {
      organizationId: session.orgId,
      category,
      title,
      content,
      status: typeof body.status === "string" ? (body.status as any) : "DRAFT",
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      settings: body.settings && typeof body.settings === "object" ? (body.settings as object) : undefined
    }
  });

  return jsonOk(record, { status: 201 });
}
