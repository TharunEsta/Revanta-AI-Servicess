import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);

  const records = await prisma.whatsAppTemplate.findMany({
    where: { organizationId: session.orgId },
    orderBy: { updatedAt: "desc" }
  });

  return jsonOk(records);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);

  const body = (await safeJson(request)) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const language = typeof body.language === "string" ? body.language.trim() : "";
  const bodyText = typeof body.body === "string" ? body.body.trim() : "";

  if (!name || !language || !bodyText) {
    return jsonError("name, language, and body are required.");
  }

  const record = await prisma.whatsAppTemplate.create({
    data: {
      organizationId: session.orgId,
      name,
      language,
      category: typeof body.category === "string" ? body.category : null,
      body: bodyText,
      components: body.components && typeof body.components === "object" ? (body.components as object) : undefined,
      status: typeof body.status === "string" ? (body.status as any) : "DRAFT",
      externalTemplateId: typeof body.externalTemplateId === "string" ? body.externalTemplateId : null,
      lastSyncedAt: typeof body.lastSyncedAt === "string" ? new Date(body.lastSyncedAt) : undefined,
      settings: body.settings && typeof body.settings === "object" ? (body.settings as object) : undefined
    }
  });

  return jsonOk(record, { status: 201 });
}
