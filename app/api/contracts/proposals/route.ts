import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { approveProposal, generateProposalFromLead } from "@/lib/revanta-os/business";
import { toJsonValue } from "@/lib/revanta-os/json";

const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function getClientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const attempts = rateLimitStore.get(key) ?? [];
  const activeAttempts = attempts.filter((attempt) => now - attempt < RATE_LIMIT_WINDOW_MS);
  if (activeAttempts.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(key, activeAttempts);
    return true;
  }
  activeAttempts.push(now);
  rateLimitStore.set(key, activeAttempts);
  return false;
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const records = await prisma.proposal.findMany({
    where: { organizationId: session.orgId },
    include: { lead: true, company: true, deal: true, project: true, owner: true },
    orderBy: { updatedAt: "desc" }
  });
  return jsonOk(records);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const clientKey = getClientKey(request);
  if (isRateLimited(clientKey)) return jsonError("Too many proposal requests from this network.", 429);

  const body = (await safeJson(request)) as Record<string, unknown>;
  const leadId = typeof body.leadId === "string" ? body.leadId : "";
  if (!leadId) return jsonError("leadId is required.");

  const proposal = await generateProposalFromLead({
    organizationId: session.orgId,
    leadId,
    userId: session.userId,
    requirements: typeof body.requirements === "string" ? body.requirements : null
  });

  return jsonOk(proposal, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const proposalId = typeof body.proposalId === "string" ? body.proposalId : "";
  if (!proposalId) return jsonError("proposalId is required.");

  if (body.approve === true) {
    const result = await approveProposal({
      organizationId: session.orgId,
      proposalId,
      userId: session.userId
    });
    return jsonOk(result);
  }

  const proposal = await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      status: typeof body.status === "string" ? (body.status as any) : undefined,
      scope: typeof body.scope === "string" ? body.scope : undefined,
      requirementSummary: typeof body.requirementSummary === "string" ? body.requirementSummary : undefined,
      approvalStatus: typeof body.approvalStatus === "string" ? body.approvalStatus : undefined,
      approvedAt: body.approvedAt === true ? new Date() : undefined,
      rejectedAt: body.rejectedAt === true ? new Date() : undefined,
      sentAt: typeof body.sentAt === "string" ? new Date(body.sentAt) : undefined,
      expiresAt: typeof body.expiresAt === "string" ? new Date(body.expiresAt) : undefined,
      deliverables: body.deliverables && typeof body.deliverables === "object" ? toJsonValue(body.deliverables) : undefined,
      timeline: body.timeline && typeof body.timeline === "object" ? toJsonValue(body.timeline) : undefined,
      metadata: body.metadata && typeof body.metadata === "object" ? toJsonValue(body.metadata) : undefined
    }
  });
  return jsonOk(proposal);
}
