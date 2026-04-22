import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.email || !body.message) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const webhookUrl = process.env.LEAD_WEBHOOK_URL;
    const webhookSecret = process.env.LEAD_WEBHOOK_SECRET;

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(webhookSecret ? { Authorization: `Bearer ${webhookSecret}` } : {})
        },
        body: JSON.stringify({
          source: "revantaai.com",
          submittedAt: new Date().toISOString(),
          ...body
        })
      });
    } else {
      console.log("Lead captured", body);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to process request." }, { status: 500 });
  }
}
