import { NextResponse } from "next/server";
import { submitBusinessForm } from "@/lib/business-forms";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.email || !body.message) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const result = await submitBusinessForm("contact", body);

    return NextResponse.json({ ok: true, message: result.successMessage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
