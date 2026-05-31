import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const record = await prisma.workflow.findFirst({
    where: { id, organizationId: session.orgId },
    include: { runs: true }
  });
  if (!record) return jsonError("Not found", 404);
  return jsonOk(record);
}

export async function PATCH(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = (await safeJson(request)) as Record<string, unknown>;
  const existing = await prisma.workflow.findFirst({
    where: { id, organizationId: session.orgId }
  });
  if (!existing) return jsonError("Not found", 404);
  const record = await prisma.workflow.update({
    where: { id },
    data: {
      name: typeof body.name === "string" ? body.name : undefined,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      triggerType: typeof body.triggerType === "string" ? body.triggerType : undefined,
      n8nWebhookUrl: typeof body.n8nWebhookUrl === "string" ? body.n8nWebhookUrl : undefined,
      definition: body.definition && typeof body.definition === "object" ? (body.definition as object) : undefined,
      status: typeof body.status === "string" ? (body.status as any) : undefined
    }
  });
  return jsonOk(record);
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const existing = await prisma.workflow.findFirst({
    where: { id, organizationId: session.orgId }
  });
  if (!existing) return jsonError("Not found", 404);
  await prisma.workflow.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
