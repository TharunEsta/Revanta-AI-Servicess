import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { toJsonObject, toJsonValue } from "@/lib/revanta-os/json";
import {
  extractCalendlyBookingTimestamp,
  extractCalendlyEventId,
  extractCalendlyInviteeEmail,
  fetchCalendlyInviteeDetails,
  getCalendlyBookingUrl,
  getCalendlyEventType,
  getCalendlyWebhookSecret,
  verifyCalendlyWebhookSignature
} from "@/lib/revanta-os/calendly";
import { triggerWorkflowEvent } from "@/lib/revanta-os/workflows";

function getCalendlySignatureHeaders(request: NextRequest) {
  return [
    request.headers.get("calendly-webhook-signature"),
    request.headers.get("x-calendly-webhook-signature"),
    request.headers.get("x-calendly-signature"),
    request.headers.get("calendly-signature")
  ];
}

async function findLeadGloballyByInviteeEmail(email: string | null) {
  if (!email) {
    return null;
  }

  return prisma.lead.findFirst({
    where: {
      OR: [{ email }, { contact: { email } }]
    },
    include: { contact: true, company: true }
  });
}

async function upsertBookingState(params: {
  organizationId: string;
  leadId: string;
  eventId: string | null;
  bookedAt: Date;
  bookingUrl: string | null;
}) {
  return prisma.lead.update({
    where: { id: params.leadId },
    data: {
      status: "MEETING_BOOKED",
      meetingScheduled: true,
      meetingBookedAt: params.bookedAt,
      calendlyEventId: params.eventId || undefined,
      calendlyBookingUrl: params.bookingUrl || undefined,
      lastActivityAt: params.bookedAt
    }
  });
}

async function clearBookingState(params: {
  organizationId: string;
  leadId: string;
}) {
  return prisma.lead.update({
    where: { id: params.leadId },
    data: {
      meetingScheduled: false,
      meetingBookedAt: null,
      calendlyEventId: null,
      status: "QUALIFIED",
      lastActivityAt: new Date()
    }
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const secret = getCalendlyWebhookSecret();
  if (secret && !verifyCalendlyWebhookSignature(rawBody, getCalendlySignatureHeaders(request))) {
    return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }

  const eventType = getCalendlyEventType(payload);
  if (!eventType || !["invitee.created", "invitee.canceled", "invitee.rescheduled"].includes(eventType)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const inviteeDetails = await fetchCalendlyInviteeDetails(payload);
  const inviteeEmail =
    extractCalendlyInviteeEmail(payload) ||
    inviteeDetails?.email?.trim().toLowerCase() ||
    null;
  const lead = await findLeadGloballyByInviteeEmail(inviteeEmail);

  const eventId = extractCalendlyEventId(payload);
  const bookedAt = extractCalendlyBookingTimestamp(payload);
  const bookingUrl = getCalendlyBookingUrl();
  const scheduledEvent = payload && typeof payload === "object" && !Array.isArray(payload)
    ? ((payload as { payload?: { scheduled_event?: { canceled?: boolean; rescheduled?: boolean } } }).payload?.scheduled_event ||
        null)
    : null;
  const rescheduled =
    Boolean((scheduledEvent as { rescheduled?: boolean } | null)?.rescheduled) ||
    eventType === "invitee.rescheduled";

  if (lead) {
    if (eventType === "invitee.created" || eventType === "invitee.rescheduled") {
      await upsertBookingState({
        organizationId: lead.organizationId,
        leadId: lead.id,
        eventId,
        bookedAt,
        bookingUrl
      });

      await prisma.activity.create({
        data: {
          organizationId: lead.organizationId,
          actorId: null,
          leadId: lead.id,
          companyId: lead.companyId || undefined,
          type: "MEETING_BOOKED",
          title: `Calendly meeting booked for ${lead.companyName || lead.fullName || lead.id}`,
          body: inviteeEmail ? `Invitee: ${inviteeEmail}` : "Calendly invitee booked",
          metadata: toJsonValue({
            eventType,
            eventId,
            inviteeEmail,
            bookingUrl,
            payload: toJsonObject(payload)
          })
        }
      });
    }

    if (eventType === "invitee.canceled" && !rescheduled) {
      await clearBookingState({
        organizationId: lead.organizationId,
        leadId: lead.id
      });

      await prisma.activity.create({
        data: {
          organizationId: lead.organizationId,
          actorId: null,
          leadId: lead.id,
          companyId: lead.companyId || undefined,
          type: "MEETING_CANCELED",
          title: `Calendly meeting canceled for ${lead.companyName || lead.fullName || lead.id}`,
          body: inviteeEmail ? `Invitee: ${inviteeEmail}` : "Calendly invitee canceled",
          metadata: toJsonValue({
            eventType,
            eventId,
            inviteeEmail,
            payload: toJsonObject(payload)
          })
        }
      });
    }

    await triggerWorkflowEvent({
      organizationId: lead.organizationId,
      actorId: null,
      eventType: "LEAD_UPDATED",
      payload: {
        leadId: lead.id,
        status: eventType === "invitee.created" || eventType === "invitee.rescheduled" ? "MEETING_BOOKED" : "QUALIFIED",
        calendlyEventId: eventId,
        calendlyBookingUrl: bookingUrl,
        inviteeEmail,
        calendlyEventType: eventType
      }
    });
  }

  console.log("[CALENDLY_WEBHOOK]", {
    eventType,
    eventId,
    inviteeEmail
  });

  return NextResponse.json({ ok: true });
}
