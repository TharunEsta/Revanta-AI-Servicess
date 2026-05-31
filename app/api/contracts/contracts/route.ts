import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { toJsonValue } from "@/lib/revanta-os/json";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const records = await prisma.contract.findMany({
    where: { organizationId: session.orgId },
    include: { proposal: true, deal: true, project: true, company: true, lead: true, statementOfWork: true, owner: true },
    orderBy: { updatedAt: "desc" }
  });
  return jsonOk(records);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title : "";
  if (!title) return jsonError("title is required.");

  const contract = await prisma.contract.create({
    data: {
      organizationId: session.orgId,
      proposalId: typeof body.proposalId === "string" ? body.proposalId : undefined,
      dealId: typeof body.dealId === "string" ? body.dealId : undefined,
      projectId: typeof body.projectId === "string" ? body.projectId : undefined,
      companyId: typeof body.companyId === "string" ? body.companyId : undefined,
      leadId: typeof body.leadId === "string" ? body.leadId : undefined,
      ownerId: session.userId,
      status: typeof body.status === "string" ? (body.status as any) : "DRAFT",
      title,
      scope: typeof body.scope === "string" ? body.scope : undefined,
      deliverables: body.deliverables && typeof body.deliverables === "object" ? toJsonValue(body.deliverables) : undefined,
      timeline: body.timeline && typeof body.timeline === "object" ? toJsonValue(body.timeline) : undefined,
      approvalStatus: typeof body.approvalStatus === "string" ? body.approvalStatus : undefined,
      approvedAt: typeof body.approvedAt === "string" ? new Date(body.approvedAt) : undefined,
      signedAt: typeof body.signedAt === "string" ? new Date(body.signedAt) : undefined,
      expiresAt: typeof body.expiresAt === "string" ? new Date(body.expiresAt) : undefined,
      metadata: body.metadata && typeof body.metadata === "object" ? toJsonValue(body.metadata) : undefined
    },
    include: { proposal: true, deal: true, project: true, company: true, lead: true, statementOfWork: true, owner: true }
  });

  return jsonOk(contract, { status: 201 });
}
