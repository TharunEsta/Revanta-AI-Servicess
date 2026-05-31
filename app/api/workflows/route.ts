import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const records = await prisma.workflow.findMany({
    where: { organizationId: session.orgId },
    include: { runs: true },
    orderBy: { updatedAt: "desc" }
  });
  return jsonOk(records);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const record = await prisma.workflow.create({
    data: {
      organizationId: session.orgId,
      ownerId: session.userId,
      name: typeof body.name === "string" ? body.name : "",
      slug: typeof body.slug === "string" ? body.slug : "",
      description: typeof body.description === "string" ? body.description : null,
      triggerType: typeof body.triggerType === "string" ? body.triggerType : null,
      n8nWebhookUrl: typeof body.n8nWebhookUrl === "string" ? body.n8nWebhookUrl : null,
      definition: body.definition && typeof body.definition === "object" ? (body.definition as object) : undefined,
      status: typeof body.status === "string" ? (body.status as any) : "ACTIVE"
    }
  });
  return jsonOk(record, { status: 201 });
}
