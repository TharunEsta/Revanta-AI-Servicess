import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/revanta-os/db";
import { hashToken, randomToken, signJwt, verifyJwt } from "@/lib/revanta-os/jwt";

const SESSION_COOKIE = "revanta_session";
const REFRESH_COOKIE = "revanta_refresh";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30;

function authSecret() {
  return process.env.JWT_SECRET || process.env.REVANTA_JWT_SECRET || "dev-secret-change-me";
}

export type SessionUser = {
  userId: string;
  email: string;
  name: string | null;
  orgId: string | null;
  role: string | null;
  sessionId: string;
};

export async function getSessionFromRequest(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const payload = await verifyJwt(token, authSecret());
  if (!payload) {
    return null;
  }

  const session = await prisma.authSession.findUnique({
    where: { jti: payload.jti },
    include: {
      user: true,
      organization: true
    }
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }

  await prisma.authSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() }
  });

  return {
    userId: session.userId,
    email: session.user.email,
    name: session.user.name ?? null,
    orgId: session.organizationId ?? null,
    role: null,
    sessionId: session.id
  };
}

async function getSessionByJti(jti: string) {
  return prisma.authSession.findFirst({
    where: {
      OR: [{ jti }, { refreshJti: jti }]
    },
    include: { user: true, organization: true }
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyJwt(token, authSecret());
  if (!payload) return null;
  const session = await prisma.authSession.findUnique({
    where: { jti: payload.jti },
    include: { user: true, organization: true }
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }
  return {
    userId: session.userId,
    email: session.user.email,
    name: session.user.name ?? null,
    orgId: session.organizationId ?? null,
    role: null,
    sessionId: session.id
  } satisfies SessionUser;
}

export async function requireSession(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return null;
  }
  return session;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  };
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: REFRESH_TTL_SECONDS
  };
}

export async function createSessionForUser(params: {
  userId: string;
  email: string;
  name: string | null;
  orgId?: string | null;
  role?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const jti = await randomToken(18);
  const refreshJti = await randomToken(18);
  const token = await signJwt(
    {
      sub: params.userId,
      orgId: params.orgId ?? undefined,
      email: params.email,
      role: params.role ?? undefined,
      jti
    },
    authSecret(),
    SESSION_TTL_SECONDS
  );
  const refreshToken = await signJwt(
    {
      sub: params.userId,
      orgId: params.orgId ?? undefined,
      email: params.email,
      role: params.role ?? undefined,
      jti: refreshJti
    },
    authSecret(),
    REFRESH_TTL_SECONDS
  );

  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
  const session = await prisma.authSession.create({
    data: {
      userId: params.userId,
      organizationId: params.orgId ?? null,
      jti,
      tokenHash: await hashToken(token),
      refreshJti,
      refreshTokenHash: await hashToken(refreshToken),
      expiresAt,
      refreshExpiresAt,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null
    }
  });

  return { token, refreshToken, session };
}

export async function revokeSessionByToken(token: string) {
  const payload = await verifyJwt(token, authSecret());
  if (!payload) return;
  await prisma.authSession.updateMany({
    where: { OR: [{ jti: payload.jti }, { refreshJti: payload.jti }], revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

export async function refreshSessionFromRequest(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;
  const payload = await verifyJwt(refreshToken, authSecret());
  if (!payload) return null;
  const session = await getSessionByJti(payload.jti);
  if (!session || session.revokedAt || !session.refreshExpiresAt || session.refreshExpiresAt <= new Date()) {
    return null;
  }

  if (!session.refreshTokenHash || (await hashToken(refreshToken)) !== session.refreshTokenHash) {
    return null;
  }

  const newJti = await randomToken(18);
  const newRefreshJti = await randomToken(18);
  const accessToken = await signJwt(
    {
      sub: session.userId,
      orgId: session.organizationId ?? undefined,
      email: session.user.email,
      role: undefined,
      jti: newJti

    },
    authSecret(),
    SESSION_TTL_SECONDS
  );
  const rotatedRefreshToken = await signJwt(
    {
      sub: session.userId,
      orgId: session.organizationId ?? undefined,
      email: session.user.email,
      role: undefined,
      jti: newRefreshJti

    },
    authSecret(),
    REFRESH_TTL_SECONDS
  );

  await prisma.authSession.update({
    where: { id: session.id },
    data: {
      jti: newJti,
      refreshJti: newRefreshJti,
      tokenHash: await hashToken(accessToken),
      refreshTokenHash: await hashToken(rotatedRefreshToken),
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
      refreshExpiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
      lastRotatedAt: new Date(),
      lastSeenAt: new Date()
    }
  });

  return {
    accessToken,
    refreshToken: rotatedRefreshToken,
    session: {
      userId: session.userId,
      email: session.user.email,
      name: session.user.name ?? null,
      orgId: session.organizationId ?? null,
      role: null,
      sessionId: session.id
    } satisfies SessionUser
  };
}

export async function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function bootstrapAdminIfNeeded() {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;

  const adminEmail =
    process.env.REVANTA_BOOTSTRAP_EMAIL ||
    process.env.REVOPS_USERNAME?.toLowerCase() + "@revanta.local" ||
    "admin@revanta.local";

  const passwordHash = process.env.REVOPS_PASSWORD_HASH || (await hashPassword("change-me-now"));

  const org = await prisma.organization.create({
    data: {
      name: process.env.REVANTA_ORG_NAME || "Revanta OS",
      slug: "revanta-os",
      settings: {}
    }
  });

  const user = await prisma.user.create({
    data: {
      email: adminEmail,
      name: process.env.REVANTA_BOOTSTRAP_NAME || "Revanta Admin",
      passwordHash,
      status: "ACTIVE"
    }
  });

  const role = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: "Owner",
      scope: "ORG"
    }
  });

  await prisma.membership.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      roleId: role.id,
      status: "ACTIVE",
      title: "Owner"
    }
  });
}

export function authErrorResponse(message = "Unauthorized") {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export async function getClientIp() {
  const hdrs = await headers();
  return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || null;
}
