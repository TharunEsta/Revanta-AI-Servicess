import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { hashToken, randomToken } from "@/lib/revanta-os/jwt";
import { safeJson } from "@/lib/revanta-os/http";
import { getRequestFingerprint, isRateLimited } from "@/lib/revanta-os/security";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const rateKey = `invite:${session.orgId}:${session.userId}:${getRequestFingerprint(request)}`;
  if (isRateLimited(rateKey, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Too many invite requests." }, { status: 429 });
  }

  const body = await safeJson(request);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const roleId = typeof body.roleId === "string" ? body.roleId : null;
  const title = typeof body.title === "string" ? body.title.trim() : null;

  if (!email) {
    return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
  }

  const token = await randomToken(24);
  const invitation = await prisma.invitation.create({
    data: {
      organizationId: session.orgId,
      senderId: session.userId,
      email,
      roleId,
      tokenHash: await hashToken(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 72)
    }
  });

  if (title) {
    await prisma.auditLog.create({
      data: {
        organizationId: session.orgId,
        actorId: session.userId,
        action: "INVITE_CREATED",
        entityType: "Invitation",
        entityId: invitation.id,
        summary: `Invitation created for ${email}`,
        metadata: { title }
      }
    });
  }

  return NextResponse.json({ ok: true, invitationId: invitation.id });
}
