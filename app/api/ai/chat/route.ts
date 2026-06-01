import { NextRequest } from "next/server";
import { getPrisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { runAIPrompt } from "@/lib/revanta-os/ai";
import { answerBusinessQuestion, generateInvoiceFromProject, generateProposalFromLead, getExecutiveMetrics } from "@/lib/revanta-os/business";
import { getRequestFingerprint, isRateLimited } from "@/lib/revanta-os/security";

export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const rateKey = `ai-chat:${session.orgId}:${session.userId}:${getRequestFingerprint(request)}`;
  if (isRateLimited(rateKey, 30, 60 * 1000)) {
    return jsonError("AI rate limit exceeded. Please try again shortly.", 429);
  }
  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  if (!prompt) return jsonError("Prompt is required.");
  const lowerPrompt = prompt.toLowerCase();
  const promptVersion = typeof body.promptVersion === "string" ? body.promptVersion : request.headers.get("x-prompt-version") || "v1";

  if (
    lowerPrompt.includes("how many leads") ||
    lowerPrompt.includes("which clients need follow-up") ||
    lowerPrompt.includes("which projects are delayed") ||
    lowerPrompt.includes("show revenue") ||
    lowerPrompt.includes("business health")
  ) {
    const answer = await answerBusinessQuestion({
      organizationId: session.orgId,
      userId: session.userId,
      question: prompt
    });
    if (answer) {
      return jsonOk(answer);
    }
  }

  if (lowerPrompt.includes("generate invoice") && typeof body.projectId === "string") {
    const invoice = await generateInvoiceFromProject({
      organizationId: session.orgId,
      projectId: body.projectId,
      userId: session.userId
    });
    return jsonOk({ action: "generate_invoice", invoice });
  }

  if (lowerPrompt.includes("create proposal") && typeof body.leadId === "string") {
    const proposal = await generateProposalFromLead({
      organizationId: session.orgId,
      leadId: body.leadId,
      userId: session.userId,
      requirements: typeof body.requirements === "string" ? body.requirements : null
    });
    return jsonOk({ action: "create_proposal", proposal });
  }

  if (lowerPrompt.includes("analyze business health")) {
    const metrics = await getExecutiveMetrics(session.orgId);
    return jsonOk({ action: "analyze_business_health", metrics });
  }

  const conversationId = typeof body.conversationId === "string" ? body.conversationId : null;
  const leadId = typeof body.leadId === "string" ? body.leadId : null;
  const conversation = conversationId
    ? await prisma.conversation.findFirst({
        where: { id: conversationId, organizationId: session.orgId },
        include: {
          lead: { include: { company: true, contact: true } },
          company: true,
          contact: true,
          messages: { orderBy: { createdAt: "desc" }, take: 12 }
        }
      })
    : null;
  const lead = !conversation && leadId
    ? await prisma.lead.findFirst({
        where: { id: leadId, organizationId: session.orgId },
        include: { company: true, contact: true, activities: { orderBy: { createdAt: "desc" }, take: 5 } }
      })
    : conversation?.lead || null;

  try {
    const result = await runAIPrompt({
      organizationId: session.orgId,
      userId: session.userId,
      purpose: "chat",
      prompt: [
        prompt,
        conversation
          ? `Conversation context:\n${conversation.messages
              .slice()
              .reverse()
              .map((message) => `${message.direction}: ${message.body}`)
              .join("\n")}`
          : "",
        lead
          ? `Lead context:\n${JSON.stringify({
              leadId: lead.id,
              name: lead.fullName || lead.companyName,
              companyName: lead.companyName,
              email: lead.email,
              phone: lead.phone,
              status: lead.status,
              score: lead.score,
              notes: lead.notes
            })}`
          : ""
      ]
        .filter(Boolean)
        .join("\n\n"),
      system:
        "You are Revanta OS AI Brain. Produce a concise, operationally useful response that reflects the company knowledge and the active record context."
      ,
      promptVersion
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "AI chat failed", 503);
  }
}
