import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { runAIPrompt } from "@/lib/revanta-os/ai";
import { getRequestFingerprint, isRateLimited } from "@/lib/revanta-os/security";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);

  const body = (await safeJson(request)) as Record<string, unknown>;
  const rateKey = `ai-reply:${session.orgId}:${session.userId}:${getRequestFingerprint(request)}`;
  if (isRateLimited(rateKey, 30, 60 * 1000)) {
    return jsonError("AI rate limit exceeded. Please try again shortly.", 429);
  }
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  if (!conversationId) return jsonError("conversationId is required.");

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, organizationId: session.orgId },
    include: {
      lead: { include: { company: true, contact: true } },
      company: true,
      contact: true,
      messages: { orderBy: { createdAt: "desc" }, take: 20 }
    }
  });
  if (!conversation) return jsonError("Conversation not found", 404);

  const promptVersion = typeof body.promptVersion === "string" ? body.promptVersion : request.headers.get("x-prompt-version") || "v1";

  const prompt =
    typeof body.prompt === "string" && body.prompt.trim()
      ? body.prompt.trim()
      : JSON.stringify({
          conversationId: conversation.id,
          lead: {
            id: conversation.lead?.id || null,
            companyName: conversation.lead?.companyName || null,
            fullName: conversation.lead?.fullName || null,
            email: conversation.lead?.email || null,
            phone: conversation.lead?.phone || null,
            status: conversation.lead?.status || null,
            score: conversation.lead?.score || null
          },
          messages: conversation.messages
            .slice()
            .reverse()
            .map((message) => ({
              direction: message.direction,
              body: message.body,
              status: message.status,
              sentAt: message.sentAt,
              deliveredAt: message.deliveredAt,
              readAt: message.readAt
            }))
        });

  try {
    const result = await runAIPrompt({
      organizationId: session.orgId,
      userId: session.userId,
      purpose: "reply",
      prompt,
      parseJson: true,
      system:
        "Generate a suggested WhatsApp reply that uses company knowledge first, stays concise, and includes a next best action. Return JSON with suggestedReply, summary, nextBestAction, confidence, and followUpQuestions."
      ,
      promptVersion
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "AI reply failed", 503);
  }
}
