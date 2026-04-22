import { NextResponse } from "next/server";
import { submitBusinessForm, type BusinessFormType } from "@/lib/business-forms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const attempts = rateLimitStore.get(key) ?? [];
  const activeAttempts = attempts.filter((attempt) => now - attempt < RATE_LIMIT_WINDOW_MS);

  if (activeAttempts.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(key, activeAttempts);
    return true;
  }

  activeAttempts.push(now);
  rateLimitStore.set(key, activeAttempts);
  return false;
}

function isBusinessFormType(value: string): value is BusinessFormType {
  return value === "bookConsultation" || value === "contact" || value === "quoteRequest" || value === "reviewRequest";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string | boolean | undefined>;
    const clientKey = getClientKey(request);

    if (body.website) {
      return NextResponse.json({ ok: true, message: "Form submitted successfully." });
    }

    if (isRateLimited(clientKey)) {
      return NextResponse.json(
        { error: "Too many submissions from this network. Please try again later." },
        { status: 429 }
      );
    }

    const rawFormType = typeof body.formType === "string" ? body.formType : "";
    if (!isBusinessFormType(rawFormType)) {
      return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
    }

    const result = await submitBusinessForm(rawFormType, body);
    return NextResponse.json({ ok: true, message: result.successMessage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit form.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
