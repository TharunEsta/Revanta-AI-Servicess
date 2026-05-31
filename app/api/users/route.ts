import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest, hashPassword } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { validatePasswordPolicy } from "@/lib/revanta-os/security";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  const users = await prisma.user.findMany({
    include: {
      memberships: {
        include: { organization: true, role: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  return jsonOk(users);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return jsonError("Email is required.");
  const password = typeof body.password === "string" ? body.password : "change-me-now";
  const passwordPolicyError = validatePasswordPolicy(password);
  if (passwordPolicyError) return jsonError(passwordPolicyError, 400);
  const user = await prisma.user.create({
    data: {
      email,
      name: typeof body.name === "string" ? body.name : null,
      phone: typeof body.phone === "string" ? body.phone : null,
      avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : null,
      passwordHash: await hashPassword(password),
      status: "ACTIVE"
    }
  });
  return jsonOk(user, { status: 201 });
}
