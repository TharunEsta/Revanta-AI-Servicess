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
  const rateKey = `ai-qualify:${session.orgId}:${session.userId}:${getRequestFingerprint(request)}`;
  if (isRateLimited(rateKey, 30, 60 * 1000)) {
    return jsonError("AI rate limit exceeded. Please try again shortly.", 429);
  }
  const leadId = typeof body.leadId === "string" ? body.leadId : null;
  const lead = leadId
    ? await prisma.lead.findFirst({
        where: { id: leadId, organizationId: session.orgId },
        include: { company: true, contact: true, activities: { orderBy: { createdAt: "desc" }, take: 5 } }
      })
    : null;

  if (!lead) return jsonError("leadId is required.");

  const prompt = typeof body.prompt === "string"
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
      });

  const promptVersion = typeof body.promptVersion === "string" ? body.promptVersion : request.headers.get("x-prompt-version") || "v1";

  try {
    const result = await runAIPrompt({
      organizationId: session.orgId,
      userId: session.userId,
      purpose: "qualify",
      prompt,
      parseJson: true,
      system:
        "You qualify leads for Revanta OS. Return JSON with score, summary, nextBestAction, reasons, and followUpQuestions.",
      promptVersion
    });
    const parsedQualification = (result.parsed || {}) as Record<string, unknown>;

    const score = typeof parsedQualification.score === "number" ? parsedQualification.score : null;
    if (score !== null) {
      const updatedLead = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          score,
          intent: typeof parsedQualification.intent === "string" ? parsedQualification.intent : undefined,
          industry: typeof parsedQualification.industry === "string" ? parsedQualification.industry : undefined,
          recommendedService:
            typeof parsedQualification.recommendedService === "string" ? parsedQualification.recommendedService : undefined,
          qualificationNotes:
            typeof parsedQualification.qualificationNotes === "string" ? parsedQualification.qualificationNotes : undefined,
          nextBestAction: typeof parsedQualification.nextBestAction === "string" ? parsedQualification.nextBestAction : undefined,
          aiQualifiedAt: new Date(),
          status: score >= 70 && lead.status === "NEW" ? "QUALIFIED" : undefined,
          enrichment: toJsonValue({
            ...toJsonObject(lead.enrichment),
            aiQualification: parsedQualification,
            aiQualifiedAt: new Date().toISOString()
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
    return jsonError(error instanceof Error ? error.message : "AI qualification failed", 503);
  }
}
