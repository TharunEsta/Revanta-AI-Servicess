import crypto from "node:crypto";

const CALENDLY_BOOKING_MESSAGE =
  "Thank you for sharing your requirements.\n\nThe next step is a 30-minute discovery call where we can understand your goals and suggest the best solution.\n\nBook your slot here:\n\n";

const CALENDLY_INTENT_KEYWORDS = [
  "price",
  "pricing",
  "quote",
  "quotation",
  "cost",
  "demo",
  "meeting",
  "call",
  "consultation"
];

export function getCalendlyBookingUrl() {
  return process.env.CALENDLY_BOOKING_URL?.trim() || null;
}

export function getCalendlyWebhookSecret() {
  return process.env.CALENDLY_WEBHOOK_SECRET?.trim() || null;
}

export function getCalendlyApiKey() {
  return process.env.CALENDLY_API_KEY?.trim() || null;
}

export function hasCalendlyMeetingIntent(text: string) {
  const normalized = text.toLowerCase();
  return CALENDLY_INTENT_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function buildCalendlyDiscoveryCallMessage(bookingUrl = getCalendlyBookingUrl()) {
  if (!bookingUrl) {
    return null;
  }

  return `${CALENDLY_BOOKING_MESSAGE}${bookingUrl}`;
}

export function buildCalendlyQualifiedMessage(bookingUrl = getCalendlyBookingUrl()) {
  if (!bookingUrl) {
    return null;
  }

  return `${CALENDLY_BOOKING_MESSAGE}${bookingUrl}`;
}

function extractSignatureCandidates(signatureHeader: string | null) {
  if (!signatureHeader) {
    return [];
  }

  return signatureHeader
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .flatMap((value) => (value.startsWith("sha256=") ? [value.slice("sha256=".length)] : [value]));
}

export function verifyCalendlyWebhookSignature(rawBody: string, signatureHeaders: Array<string | null>) {
  const secret = getCalendlyWebhookSecret();
  if (!secret) {
    return true;
  }

  const expectedHex = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBase64 = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  const candidates = signatureHeaders.flatMap(extractSignatureCandidates);

  return candidates.some((candidate) => candidate === expectedHex || candidate === expectedBase64);
}

export function getCalendlyEventType(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const event = (payload as { event?: unknown }).event;
  if (typeof event === "string") {
    return event;
  }

  return null;
}

export function getCalendlyInvitee(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const body = payload as {
    payload?: { invitee?: unknown; event?: unknown };
    invitee?: unknown;
  };

  const invitee = body.payload?.invitee ?? body.invitee;
  if (!invitee || typeof invitee !== "object" || Array.isArray(invitee)) {
    return null;
  }

  return invitee as {
    email?: string;
    name?: string;
    uri?: string;
    cancel_url?: string;
    reschedule_url?: string;
    status?: string;
    created_at?: string;
  };
}

export function getCalendlyScheduledEvent(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const body = payload as {
    payload?: { event?: unknown; scheduled_event?: unknown };
    event?: unknown;
    scheduled_event?: unknown;
  };

  const event = body.payload?.scheduled_event ?? body.payload?.event ?? body.scheduled_event ?? body.event;
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return null;
  }

  return event as {
    uri?: string;
    start_time?: string;
    end_time?: string;
    status?: string;
    canceled?: boolean;
    rescheduled?: boolean;
  };
}

export function extractCalendlyEventId(payload: unknown) {
  const event = getCalendlyScheduledEvent(payload);
  const invitee = getCalendlyInvitee(payload);

  const uri = event?.uri || invitee?.uri || null;
  if (!uri) {
    return null;
  }

  const parts = uri.split("/");
  return parts[parts.length - 1] || null;
}

export function extractCalendlyInviteeEmail(payload: unknown) {
  return getCalendlyInvitee(payload)?.email?.trim().toLowerCase() || null;
}

export function extractCalendlyBookingTimestamp(payload: unknown) {
  const event = getCalendlyScheduledEvent(payload);
  const invitee = getCalendlyInvitee(payload);
  const candidates = [invitee?.created_at, event?.start_time].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const date = new Date(candidate);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return new Date();
}

function splitCalendlyUri(uri: string) {
  const match = uri.match(/https:\/\/api\.calendly\.com\/scheduled_events\/([^/]+)\/invitees\/([^/]+)$/);
  if (!match) {
    return null;
  }

  return { eventUuid: match[1], inviteeUuid: match[2] };
}

export async function fetchCalendlyInviteeDetails(payload: unknown) {
  const invitee = getCalendlyInvitee(payload);
  const inviteeUri = invitee?.uri;
  const apiKey = getCalendlyApiKey();

  if (!inviteeUri || !apiKey) {
    return invitee;
  }

  const parts = splitCalendlyUri(inviteeUri);
  if (!parts) {
    return invitee;
  }

  try {
    const response = await fetch(
      `https://api.calendly.com/scheduled_events/${parts.eventUuid}/invitees/${parts.inviteeUuid}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      return invitee;
    }

    const json = (await response.json().catch(() => null)) as any;
    const resource = json?.resource || json?.data || json;

    if (!resource || typeof resource !== "object") {
      return invitee;
    }

    return {
      ...invitee,
      email: typeof resource.email === "string" ? resource.email : invitee?.email,
      name: typeof resource.name === "string" ? resource.name : invitee?.name,
      uri: typeof resource.uri === "string" ? resource.uri : invitee?.uri,
      status: typeof resource.status === "string" ? resource.status : invitee?.status,
      created_at: typeof resource.created_at === "string" ? resource.created_at : invitee?.created_at,
      cancel_url: typeof resource.cancel_url === "string" ? resource.cancel_url : invitee?.cancel_url,
      reschedule_url: typeof resource.reschedule_url === "string" ? resource.reschedule_url : invitee?.reschedule_url
    };
  } catch {
    return invitee;
  }
}
