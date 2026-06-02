import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { triggerWorkflowEvent } from "@/lib/revanta-os/workflows";
import { qualifyLeadWithBrain } from "@/lib/revanta-os/ai";
import { toJsonObject, toJsonValue } from "@/lib/revanta-os/json";
import { buildCalendlyQualifiedMessage, getCalendlyBookingUrl } from "@/lib/revanta-os/calendly";
import { sendWhatsAppTextMessage } from "@/lib/revanta-os/whatsapp";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const database = prisma as any;
  const leads = await database.lead.findMany({
    where: { organizationId: session.orgId, archivedAt: null },
    include: {
      owner: true,
      company: true,
      contact: true,
      activities: { orderBy: { createdAt: "desc" }, take: 5 }
    },
    orderBy: { updatedAt: "desc" }
  });
  return jsonOk(leads);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const database = prisma as any;
  const lead = await database.lead.create({
    data: {
      organizationId: session.orgId,
      companyName: typeof body.companyName === "string" ? body.companyName : null,
      fullName: typeof body.fullName === "string" ? body.fullName : null,
      email: typeof body.email === "string" ? body.email.toLowerCase() : null,
      phone: typeof body.phone === "string" ? body.phone : null,
      website: typeof body.website === "string" ? body.website : null,
      linkedinUrl: typeof body.linkedinUrl === "string" ? body.linkedinUrl : null,
      category: typeof body.category === "string" ? body.category : null,
      sourceUrl: typeof body.sourceUrl === "string" ? body.sourceUrl : null,
      sourceLabel: typeof body.sourceLabel === "string" ? body.sourceLabel : null,
      source: typeof body.source === "string" ? (body.source as any) : "MANUAL",
      ownerId: typeof body.ownerId === "string" ? body.ownerId : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      status: typeof body.status === "string" ? (body.status as any) : "NEW",
      enrichment: body.enrichment && typeof body.enrichment === "object" ? (body.enrichment as object) : null
    }
  });
  const qualification = await qualifyLeadWithBrain({
    organizationId: session.orgId,
    userId: session.userId,
    lead: {
      id: lead.id,
      companyName: lead.companyName,
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
      category: lead.category,
      sourceLabel: lead.sourceLabel,
      notes: lead.notes,
      status: lead.status,
      score: lead.score,
      enrichment: lead.enrichment,
      aiSummary: null
    }
  });
  const parsedQualification = (qualification.parsed || {}) as Record<string, unknown>;

  const updatedLead = await database.lead.update({
    where: { id: lead.id },
    data: {
      score: typeof parsedQualification.score === "number" ? parsedQualification.score : lead.score,
      status:
        typeof parsedQualification.status === "string"
          ? (parsedQualification.status as any)
          : typeof parsedQualification.score === "number" && parsedQualification.score >= 70
            ? "QUALIFIED"
            : undefined,
      intent: typeof parsedQualification.intent === "string" ? parsedQualification.intent : undefined,
      industry: typeof parsedQualification.industry === "string" ? parsedQualification.industry : undefined,
      recommendedService:
        typeof parsedQualification.recommendedService === "string" ? parsedQualification.recommendedService : undefined,
      qualificationNotes:
        typeof parsedQualification.qualificationNotes === "string" ? parsedQualification.qualificationNotes : undefined,
      nextBestAction:
        typeof parsedQualification.nextBestAction === "string" ? parsedQualification.nextBestAction : undefined,
      aiQualifiedAt: new Date(),
      calendlyBookingUrl: getCalendlyBookingUrl() || undefined,
      enrichment: toJsonValue({
        ...toJsonObject(lead.enrichment),
        aiQualification: parsedQualification
      })
    }
  });
  await database.activity.create({
    data: {
      organizationId: session.orgId,
      actorId: session.userId,
      leadId: updatedLead.id,
      type: "LEAD_CREATED",
      title: `Lead created: ${updatedLead.companyName || updatedLead.fullName || updatedLead.id}`,
      body: updatedLead.source
    }
  });

  await triggerWorkflowEvent({
    organizationId: session.orgId,
    actorId: session.userId,
    eventType: "LEAD_CREATED",
    payload: {
      leadId: updatedLead.id,
      companyName: updatedLead.companyName,
      fullName: updatedLead.fullName,
      email: updatedLead.email,
      phone: updatedLead.phone,
      source: updatedLead.source,
      status: updatedLead.status,
      score: updatedLead.score,
      intent: updatedLead.intent,
      industry: updatedLead.industry,
      recommendedService: updatedLead.recommendedService
    }
  });

  const bookingUrl = getCalendlyBookingUrl();
  if (updatedLead.status === "QUALIFIED" && bookingUrl) {
    const conversation = await database.conversation.findFirst({
      where: {
        organizationId: session.orgId,
        leadId: updatedLead.id,
        channel: "WHATSAPP"
      },
      include: { lead: true, contact: true },
      orderBy: { updatedAt: "desc" }
    });

    if (conversation) {
      const bookingMessage = buildCalendlyQualifiedMessage(bookingUrl);
      if (bookingMessage) {
        await database.conversation.update({
          where: { id: conversation.id },
          data: {
            metadata: toJsonValue({
              ...(conversation.metadata && typeof conversation.metadata === "object" && !Array.isArray(conversation.metadata)
                ? (conversation.metadata as Record<string, unknown>)
                : {}),
              flowStep: "BOOK_DISCOVERY_CALL",
              lastBotInteraction: new Date().toISOString(),
              calendlyBookingUrl: bookingUrl
            })
          }
        });

        await sendWhatsAppTextMessage({
          organizationId: session.orgId,
          conversationId: conversation.id,
          text: bookingMessage,
          metadata: { source: "consultant", autoReply: true, calendlyBookingUrl: bookingUrl }
        });
      }
    }
  }
  return jsonOk(updatedLead, { status: 201 });
}
