import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { runAIPrompt } from "@/lib/revanta-os/ai";
import { triggerWorkflowEvent } from "@/lib/revanta-os/workflows";
import { toJsonObject, toJsonValue } from "@/lib/revanta-os/json";
import { getRequestFingerprint, isRateLimited } from "@/lib/revanta-os/security";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);

  const body = (await safeJson(request)) as Record<string, unknown>;
  const rateKey = `ai-score:${session.orgId}:${session.userId}:${getRequestFingerprint(request)}`;
  if (isRateLimited(rateKey, 30, 60 * 1000)) {
    return jsonError("AI rate limit exceeded. Please try again shortly.", 429);
  }
  const leadId = typeof body.leadId === "string" ? body.leadId : "";
  if (!leadId) return jsonError("leadId is required.");

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId: session.orgId },
    include: { company: true, contact: true, activities: { orderBy: { createdAt: "desc" }, take: 8 } }
  });
  if (!lead) return jsonError("Lead not found", 404);

  const promptVersion = typeof body.promptVersion === "string" ? body.promptVersion : request.headers.get("x-prompt-version") || "v1";

  try {
    const result = await runAIPrompt({
      organizationId: session.orgId,
      userId: session.userId,
      purpose: "score",
      prompt:
        typeof body.prompt === "string"
          ? body.prompt
          : JSON.stringify({
              leadId: lead.id,
              companyName: lead.companyName,
              fullName: lead.fullName,
              email: lead.email,
              phone: lead.phone,
              website: lead.website,
              linkedinUrl: lead.linkedinUrl,
              source: lead.source,
              status: lead.status,
              score: lead.score,
              notes: lead.notes,
              enrichment: lead.enrichment
            }),
      parseJson: true,
      system:
        "Score the lead from 0 to 100 using company knowledge and CRM context. Return JSON with score, summary, nextBestAction, reasons, and questions.",
      promptVersion
    });
    const parsedScoreResult = (result.parsed || {}) as Record<string, unknown>;

    const score = typeof parsedScoreResult.score === "number" ? parsedScoreResult.score : null;
    if (score !== null) {
      const updatedLead = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          score,
          intent: typeof parsedScoreResult.intent === "string" ? parsedScoreResult.intent : undefined,
          industry: typeof parsedScoreResult.industry === "string" ? parsedScoreResult.industry : undefined,
          recommendedService:
            typeof parsedScoreResult.recommendedService === "string" ? parsedScoreResult.recommendedService : undefined,
          qualificationNotes:
            typeof parsedScoreResult.qualificationNotes === "string" ? parsedScoreResult.qualificationNotes : undefined,
          nextBestAction: typeof parsedScoreResult.nextBestAction === "string" ? parsedScoreResult.nextBestAction : undefined,
          aiQualifiedAt: new Date(),
          enrichment: toJsonValue({
            ...toJsonObject(lead.enrichment),
            aiScore: parsedScoreResult,
            aiScoredAt: new Date().toISOString()
          }),
          lastActivityAt: new Date()
        }
      });

      await triggerWorkflowEvent({
        organizationId: session.orgId,
        actorId: session.userId,
        eventType: "LEAD_UPDATED",
        payload: {
          leadId: updatedLead.id,
          companyName: updatedLead.companyName,
          fullName: updatedLead.fullName,
          email: updatedLead.email,
          phone: updatedLead.phone,
          status: updatedLead.status,
          score: updatedLead.score
        }
      });
    }

    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "AI score failed", 503);
  }
}
