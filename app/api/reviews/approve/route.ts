import { NextResponse } from "next/server";
import { moderateReview } from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const secret = process.env.REVIEW_ADMIN_SECRET;
    const providedSecret =
      request.headers.get("x-admin-secret") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (!secret || providedSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();

    if (!body.reviewId || !body.action || !["approve", "reject"].includes(body.action)) {
      return NextResponse.json({ error: "Invalid moderation request." }, { status: 400 });
    }

    const review = await moderateReview(body.reviewId, body.action);
    return NextResponse.json({ ok: true, review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to moderate review.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
