import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  processIncomingWhatsAppMessage,
  recordWhatsAppStatusUpdate,
  resolveOrganizationFromPhoneNumberId
} from "@/lib/revanta-os/whatsapp";

async function resolveMetaMediaUrl(mediaId: string | null) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!mediaId || !accessToken) return null;

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) return null;
    const json = await response.json().catch(() => null);
    return typeof json?.url === "string" ? json.url : null;
  } catch {
    return null;
  }
}

async function extractInboundMedia(message: any) {
  const mediaType = ["image", "document", "video", "audio"].find((type) => Boolean(message?.[type]));
  if (!mediaType) return null;

  const media = message[mediaType] || {};
  const mediaId = typeof media.id === "string" ? media.id : null;
  return {
    mediaId,
    mediaUrl: await resolveMetaMediaUrl(mediaId),
    mediaType,
    mimeType: typeof media.mime_type === "string" ? media.mime_type : null,
    fileName:
      typeof media.filename === "string"
        ? media.filename
        : typeof media.caption === "string"
          ? media.caption
          : null
  };
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const verifyToken = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && verifyToken && verifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return NextResponse.json({ ok: false }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const appSecret = process.env.META_APP_SECRET?.trim();
  const signature = request.headers.get("x-hub-signature-256");

  if (appSecret) {
    if (!signature || !signature.startsWith("sha256=")) {
      return NextResponse.json({ ok: false, error: "Missing signature." }, { status: 401 });
    }
    const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
    const provided = signature.slice("sha256=".length);
    if (expected !== provided) {
      return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }

  console.log("[WA_WEBHOOK_RECEIVED]", {
    entries: payload?.entry?.length
  });

  const entries = payload?.entry ?? [];


  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};

      console.log("[WA_WEBHOOK_VALUE]", {
        phoneNumberId: value.metadata?.phone_number_id,
        businessAccountId: entry.id || null,
        messageCount: value.messages?.length ?? 0,
        statusCount: value.statuses?.length ?? 0
      });

      const phoneNumberId = value.metadata?.phone_number_id || null;
      const businessAccountId = entry.id || null;

      if (!phoneNumberId) {
        continue;
      }

      const organizationId = await resolveOrganizationFromPhoneNumberId(phoneNumberId, businessAccountId);

      if (!organizationId) {
        continue;
      }


      for (const message of value.messages ?? []) {
        const contacts = value.contacts ?? [];
        const contactName = contacts[0]?.profile?.name || null;
        const from = message.from || value.contacts?.[0]?.wa_id || "";
        if (!from) continue;

        console.log("[WA_PROCESS_MESSAGE]", {
          from,
          messageId: message.id,
          hasText: !!message.text?.body
        });



        try {
          const interactive = message.interactive ?? null;
          const interactiveListId = interactive?.list_reply?.id;
          const interactiveListTitle = interactive?.list_reply?.title;
          const interactiveButtonId = interactive?.button_reply?.id;
          const interactiveButtonTitle = interactive?.button_reply?.title;

          // Prefer the stable ID (e.g. service_ai). Fall back to title for robustness.
          const interactiveSelection =
            typeof interactiveListId === "string"
              ? interactiveListId
              : typeof interactiveButtonId === "string"
                ? interactiveButtonId
                : typeof interactiveListTitle === "string"
                  ? interactiveListTitle
                  : typeof interactiveButtonTitle === "string"
                    ? interactiveButtonTitle
                    : null;
          const inboundMedia = await extractInboundMedia(message);

          await processIncomingWhatsAppMessage({
            organizationId,
            from,
            body:
              interactiveSelection ||
              message.text?.body ||
              message.caption ||
              message.image?.caption ||
              message.video?.caption ||
              message.document?.caption ||
              (inboundMedia ? `[${inboundMedia.mediaType}] ${inboundMedia.fileName || "media"}` : "[non-text message]"),
            messageId: message.id,
            name: contactName,
            phoneNumberId,
            waId: value.contacts?.[0]?.wa_id || from,
            media: inboundMedia
          });
        } catch (error) {
          console.error("[WA_PROCESS_ERROR]", error);
        }
      }



      for (const status of value.statuses ?? []) {
        await recordWhatsAppStatusUpdate({
          organizationId,
          externalMessageId: status.id,
          status: status.status,
          timestamp: status.timestamp ? new Date(Number(status.timestamp) * 1000) : new Date()
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
