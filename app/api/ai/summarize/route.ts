import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { runAIPrompt } from "@/lib/revanta-os/ai";
import { toJsonObject, toJsonValue } from "@/lib/revanta-os/json";
import { getRequestFingerprint, isRateLimited } from "@/lib/revanta-os/security";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const rateKey = `ai-summarize:${session.orgId}:${session.userId}:${getRequestFingerprint(request)}`;
  if (isRateLimited(rateKey, 30, 60 * 1000)) {
    return jsonError("AI rate limit exceeded. Please try again shortly.", 429);
  }
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : null;
  const leadId = typeof body.leadId === "string" ? body.leadId : null;
  const conversation = conversationId
    ? await prisma.conversation.findFirst({
        where: { id: conversationId, organizationId: session.orgId },
        include: { lead: true, company: true, contact: true, messages: { orderBy: { createdAt: "asc" } } }
      })
    : null;
  const lead = !conversation && leadId
    ? await prisma.lead.findFirst({
        where: { id: leadId, organizationId: session.orgId },
        include: { company: true, contact: true, activities: { orderBy: { createdAt: "desc" }, take: 8 } }
      })
    : conversation?.lead || null;

  const promptVersion = typeof body.promptVersion === "string" ? body.promptVersion : request.headers.get("x-prompt-version") || "v1";

  const prompt = typeof body.prompt === "string"
    ? body.prompt
    : conversation
      ? JSON.stringify({
          conversationId: conversation.id,
          subject: conversation.subject,
          channel: conversation.channel,
          status: conversation.status,
          messages: conversation.messages.map((message: any) => ({ 
            direction: message.direction,
            body: message.body,
            status: message.status,
            sentAt: message.sentAt,
            deliveredAt: message.deliveredAt,
            readAt: message.readAt
          }))
        })
      : JSON.stringify(lead);

  try {
    const result = await runAIPrompt({
      organizationId: session.orgId,
      userId: session.userId,
      purpose: "summarize",
      prompt,
      parseJson: true,
      system: "Summarize the conversation or record into a concise operational brief with next steps and risks."
      ,
      promptVersion
    });

    if (lead) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          aiSummary: toJsonValue({
            ...toJsonObject(lead.aiSummary),
            summary: result.parsed || result.output,
            summarizedAt: new Date().toISOString()
          }),
          lastActivityAt: new Date()
        }
      });
    }

    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "AI summarize failed", 503);
  }
}
