import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { hashToken, randomToken } from "@/lib/revanta-os/jwt";
import { safeJson } from "@/lib/revanta-os/http";
import { getRequestFingerprint, isRateLimited } from "@/lib/revanta-os/security";

export async function POST(request: NextRequest) {
  const body = await safeJson(request);
  const rateKey = `password-reset:${getRequestFingerprint(request)}`;
  if (isRateLimited(rateKey, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Too many password reset requests." }, { status: 429 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = await randomToken(24);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: await hashToken(token),
        resetTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60)
      }
    });
  }

  return NextResponse.json({ ok: true });
}
