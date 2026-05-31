import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  processIncomingWhatsAppMessage,
  recordWhatsAppStatusUpdate,
  resolveOrganizationFromPhoneNumberId
} from "@/lib/revanta-os/whatsapp";

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
  const entries = payload?.entry ?? [];

  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      const phoneNumberId = value.metadata?.phone_number_id || null;
      if (!phoneNumberId) {
        continue;
      }

      const organizationId = await resolveOrganizationFromPhoneNumberId(phoneNumberId);
      if (!organizationId) {
        continue;
      }

      for (const message of value.messages ?? []) {
        const contacts = value.contacts ?? [];
        const contactName = contacts[0]?.profile?.name || null;
        const from = message.from || value.contacts?.[0]?.wa_id || "";
        if (!from) continue;
        await processIncomingWhatsAppMessage({
          organizationId,
          from,
          body: message.text?.body || message.caption || "[non-text message]",
          messageId: message.id,
          name: contactName,
          phoneNumberId,
          waId: value.contacts?.[0]?.wa_id || from
        });
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
