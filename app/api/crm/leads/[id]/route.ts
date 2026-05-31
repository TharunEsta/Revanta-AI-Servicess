import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { triggerWorkflowEvent } from "@/lib/revanta-os/workflows";

function getFollowUpAt(enrichment: unknown) {
  if (!enrichment || typeof enrichment !== "object" || Array.isArray(enrichment)) {
    return null;
  }

  const value = (enrichment as { followUpAt?: unknown }).followUpAt;
  return typeof value === "string" && value.trim() ? value : null;
}

function hasMeaningfulLeadChanges(current: any, body: Record<string, unknown>) {
  if (!current) {
    return false;
  }

  const currentFollowUpAt = getFollowUpAt(current.enrichment);
  const nextFollowUpAt =
    body.enrichment && typeof body.enrichment === "object" ? getFollowUpAt(body.enrichment) : currentFollowUpAt;

  const checks: Array<[unknown, unknown]> = [
    [body.companyName, current.companyName],
    [body.fullName, current.fullName],
    [body.email ? String(body.email).toLowerCase() : undefined, current.email],
    [body.phone, current.phone],
    [body.website, current.website],
    [body.linkedinUrl, current.linkedinUrl],
    [body.category, current.category],
    [body.sourceLabel, current.sourceLabel],
    [body.notes, current.notes],
    [body.ownerId, current.ownerId],
    [body.status, current.status],
    [nextFollowUpAt, currentFollowUpAt]
  ];

  return checks.some(([nextValue, currentValue]) => nextValue !== undefined && nextValue !== currentValue);
}

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const database = prisma as any;
  const lead = await database.lead.findFirst({
    where: { id, organizationId: session.orgId },
    include: {
      owner: true,
      company: true,
      contact: true,
      activities: { orderBy: { createdAt: "desc" }, take: 5 },
      tasks: true,
      messages: true
    }
  });
  if (!lead) return jsonError("Not found", 404);
  return jsonOk(lead);
}

export async function PATCH(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = (await safeJson(request)) as Record<string, unknown>;
  const database = prisma as any;
  const current = await database.lead.findFirst({ where: { id, organizationId: session.orgId } });
  if (!current) return jsonError("Not found", 404);
  const nextEnrichment =
    body.enrichment === null
      ? null
      : body.enrichment && typeof body.enrichment === "object"
        ? (body.enrichment as object)
        : undefined;
  const lead = await database.lead.update({
    where: { id },
    data: {
      companyName: typeof body.companyName === "string" ? body.companyName : undefined,
      fullName: typeof body.fullName === "string" ? body.fullName : undefined,
      email: typeof body.email === "string" ? body.email.toLowerCase() : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      website: typeof body.website === "string" ? body.website : undefined,
      linkedinUrl: typeof body.linkedinUrl === "string" ? body.linkedinUrl : undefined,
      category: typeof body.category === "string" ? body.category : undefined,
      sourceLabel: typeof body.sourceLabel === "string" ? body.sourceLabel : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      ownerId: typeof body.ownerId === "string" ? body.ownerId : undefined,
      status: typeof body.status === "string" ? (body.status as any) : undefined,
      enrichment: nextEnrichment,
      lastActivityAt: new Date()
    }
  });

  const notesChanged = typeof body.notes === "string" && body.notes.trim() && body.notes !== current.notes;
  const stageChanged = typeof body.status === "string" && body.status !== current.status;
  const ownerChanged = typeof body.ownerId === "string" && body.ownerId !== current.ownerId;
  const followUpChanged = nextEnrichment !== undefined && getFollowUpAt(nextEnrichment) !== getFollowUpAt(current.enrichment);
  const generalChanged = hasMeaningfulLeadChanges(current, body);

  if (notesChanged) {
    await database.activity.create({
      data: {
        organizationId: session.orgId,
        actorId: session.userId,
        leadId: lead.id,
        type: "LEAD_NOTE",
        title: `Note updated for ${lead.companyName || lead.fullName || lead.id}`,
        body: body.notes
      }
    });
  } else if (followUpChanged) {
    const followUpAt = getFollowUpAt(nextEnrichment);
    await database.activity.create({
      data: {
        organizationId: session.orgId,
        actorId: session.userId,
        leadId: lead.id,
        type: "LEAD_FOLLOW_UP",
        title: `Follow-up updated for ${lead.companyName || lead.fullName || lead.id}`,
        body: followUpAt ? `Follow-up set for ${followUpAt}` : "Follow-up cleared",
        metadata: followUpAt ? { followUpAt } : null
      }
    });
  } else if (stageChanged || ownerChanged || generalChanged) {
    await database.activity.create({
      data: {
        organizationId: session.orgId,
        actorId: session.userId,
        leadId: lead.id,
        type: stageChanged ? "LEAD_STAGE_UPDATED" : ownerChanged ? "LEAD_OWNER_UPDATED" : "LEAD_UPDATED",
        title: `Lead updated: ${lead.companyName || lead.fullName || lead.id}`,
        body: stageChanged
          ? `Status changed from ${current.status} to ${lead.status}`
          : ownerChanged
            ? "Owner updated"
            : "Lead details updated"
      }
    });
  }

  if (stageChanged || ownerChanged || generalChanged) {
    await triggerWorkflowEvent({
      organizationId: session.orgId,
      actorId: session.userId,
      eventType: "LEAD_UPDATED",
      payload: {
        leadId: lead.id,
        companyName: lead.companyName,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        ownerId: lead.ownerId
      }
    });
  }

  return jsonOk(lead);
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const database = prisma as any;
  const { id } = await context.params;
  const existing = await database.lead.findFirst({ where: { id, organizationId: session.orgId } });
  if (!existing) return jsonError("Not found", 404);
  await database.lead.update({
    where: { id },
    data: { archivedAt: new Date(), status: "ARCHIVED" }
  });
  return jsonOk({ archived: true });
}
