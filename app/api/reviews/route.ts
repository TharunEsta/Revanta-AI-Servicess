import { NextResponse } from "next/server";
import { sendReviewSubmissionNotification, submitReview } from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const clientKey = getClientKey(request);

    if (body.website) {
      return NextResponse.json({ ok: true, message: "Review submitted for moderation." });
    }

    if (isRateLimited(clientKey)) {
      return NextResponse.json(
        { error: "Too many submissions from this network. Please try again later." },
        { status: 429 }
      );
    }

    const review = await submitReview({
      fullName: body.fullName,
      companyName: body.companyName,
      role: body.role,
      email: body.email,
      rating: Number(body.rating),
      serviceUsed: body.serviceUsed,
      projectType: body.projectType,
      reviewText: body.reviewText,
      permissionToPublish: body.permissionToPublish === true || body.permissionToPublish === "true",
      profileImageUrl: body.profileImageUrl
    });

    await sendReviewSubmissionNotification(review);

    return NextResponse.json({
      ok: true,
      message: "Review submitted successfully. It will appear after admin approval."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit review.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
