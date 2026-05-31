import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function PATCH(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = (await safeJson(request)) as Record<string, unknown>;
  const existing = await prisma.whatsAppTemplate.findFirst({ where: { id, organizationId: session.orgId } });
  if (!existing) return jsonError("Not found", 404);

  const record = await prisma.whatsAppTemplate.update({
    where: { id },
    data: {
      name: typeof body.name === "string" ? body.name.trim() : undefined,
      language: typeof body.language === "string" ? body.language.trim() : undefined,
      category: typeof body.category === "string" ? body.category : undefined,
      body: typeof body.body === "string" ? body.body.trim() : undefined,
      components: body.components && typeof body.components === "object" ? (body.components as object) : undefined,
      status: typeof body.status === "string" ? (body.status as any) : undefined,
      externalTemplateId: typeof body.externalTemplateId === "string" ? body.externalTemplateId : undefined,
      lastSyncedAt: typeof body.lastSyncedAt === "string" ? new Date(body.lastSyncedAt) : undefined,
      settings: body.settings && typeof body.settings === "object" ? (body.settings as object) : undefined
    }
  });

  return jsonOk(record);
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const existing = await prisma.whatsAppTemplate.findFirst({ where: { id, organizationId: session.orgId } });
  if (!existing) return jsonError("Not found", 404);

  await prisma.whatsAppTemplate.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
