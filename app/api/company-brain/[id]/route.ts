import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function PATCH(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = (await safeJson(request)) as Record<string, unknown>;

  const existing = await prisma.companyKnowledge.findFirst({ where: { id, organizationId: session.orgId } });
  if (!existing) return jsonError("Not found", 404);

  const record = await prisma.companyKnowledge.update({
    where: { id },
    data: {
      category: typeof body.category === "string" ? body.category.trim() : undefined,
      title: typeof body.title === "string" ? body.title.trim() : undefined,
      content: typeof body.content === "string" ? body.content.trim() : undefined,
      status: typeof body.status === "string" ? (body.status as any) : undefined,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
      settings: body.settings && typeof body.settings === "object" ? (body.settings as object) : undefined
    }
  });

  return jsonOk(record);
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const existing = await prisma.companyKnowledge.findFirst({ where: { id, organizationId: session.orgId } });
  if (!existing) return jsonError("Not found", 404);

  await prisma.companyKnowledge.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
