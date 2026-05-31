import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/revanta-os/db";
import { bootstrapAdminIfNeeded, createSessionForUser, refreshCookieOptions, sessionCookieOptions } from "@/lib/revanta-os/auth";
import { safeJson } from "@/lib/revanta-os/http";
import { getRequestFingerprint, isRateLimited } from "@/lib/revanta-os/security";

function normalizeIdentifier(identifier: unknown) {
  return typeof identifier === "string" ? identifier.trim().toLowerCase() : "";
}

export async function POST(request: NextRequest) {
  const body = await safeJson(request);
  const rateKey = `login:${getRequestFingerprint(request)}`;
  if (isRateLimited(rateKey, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Too many login attempts. Please try again later." }, { status: 429 });
  }
  const identifier = normalizeIdentifier(body.identifier);
  const password = typeof body.password === "string" ? body.password : "";

  if (!identifier || !password) {
    return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
  }

  await bootstrapAdminIfNeeded();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { name: identifier }
      ]
    },
    include: {
      memberships: {
        include: { role: true, organization: true }
      }
    }
  });

  const bootstrapUsername = process.env.REVOPS_USERNAME?.trim().toLowerCase();
  const bootstrapHash = process.env.REVOPS_PASSWORD_HASH?.trim();
  const bootstrapAllowed =
    bootstrapUsername &&
    bootstrapHash &&
    identifier === bootstrapUsername &&
    (await bcrypt.compare(password, bootstrapHash.replace(/^"|"$/g, "")));

  let signedUser = user;
  if (!signedUser && bootstrapAllowed) {
    signedUser = await prisma.user.findFirst({
      where: { email: `${bootstrapUsername}@revanta.local` },
      include: {
        memberships: {
          include: { role: true, organization: true }
        }
      }
    });
  }

  if (!signedUser) {
    return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
  }

  const membership = signedUser.memberships[0] || null;
  const matchesPassword = signedUser.passwordHash ? await bcrypt.compare(password, signedUser.passwordHash) : false;

  if (!matchesPassword && !bootstrapAllowed) {
    return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
  }

  const session = await createSessionForUser({
    userId: signedUser.id,
    email: signedUser.email,
    name: signedUser.name ?? null,
    orgId: membership?.organizationId ?? null,
    role: membership?.role?.name ?? null,
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null,
    userAgent: request.headers.get("user-agent")
  });

  const response = NextResponse.json({
    ok: true,
    user: {
      id: signedUser.id,
      email: signedUser.email,
      name: signedUser.name,
      orgId: membership?.organizationId ?? null
    }
  });
  response.cookies.set("revanta_session", session.token, {
    ...sessionCookieOptions()
  });
  response.cookies.set("revanta_refresh", session.refreshToken, {
    ...refreshCookieOptions()
  });

  return response;
}
