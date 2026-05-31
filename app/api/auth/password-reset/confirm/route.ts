import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/revanta-os/db";
import { hashToken } from "@/lib/revanta-os/jwt";
import { safeJson } from "@/lib/revanta-os/http";
import { validatePasswordPolicy } from "@/lib/revanta-os/security";

export async function POST(request: NextRequest) {
  const body = await safeJson(request);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !token || !password) {
    return NextResponse.json({ ok: false, error: "Missing fields." }, { status: 400 });
  }

  const passwordPolicyError = validatePasswordPolicy(password);
  if (passwordPolicyError) {
    return NextResponse.json({ ok: false, error: passwordPolicyError }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.resetTokenHash || !user.resetTokenExpiresAt) {
    return NextResponse.json({ ok: false, error: "Invalid token." }, { status: 400 });
  }

  if (user.resetTokenExpiresAt < new Date() || user.resetTokenHash !== (await hashToken(token))) {
    return NextResponse.json({ ok: false, error: "Invalid or expired token." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null
    }
  });

  return NextResponse.json({ ok: true });
}
