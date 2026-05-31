import type { NextRequest } from "next/server";

const rateLimitStore = new Map<string, number[]>();

export function validatePasswordPolicy(password: string) {
  const trimmed = password.trim();
  if (trimmed.length < 12) {
    return "Password must be at least 12 characters long.";
  }
  if (!/[A-Z]/.test(trimmed)) {
    return "Password must include at least one uppercase letter.";
  }
  if (!/[a-z]/.test(trimmed)) {
    return "Password must include at least one lowercase letter.";
  }
  if (!/[0-9]/.test(trimmed)) {
    return "Password must include at least one number.";
  }
  if (!/[^A-Za-z0-9]/.test(trimmed)) {
    return "Password must include at least one special character.";
  }
  return null;
}

export function getRequestFingerprint(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-vercel-forwarded-for") ||
    "unknown"
  );
}

export function isRateLimited(key: string, limit = 60, windowMs = 60 * 1000) {
  const now = Date.now();
  const attempts = rateLimitStore.get(key) ?? [];
  const activeAttempts = attempts.filter((attempt) => attempt > now - windowMs);
  if (activeAttempts.length >= limit) {
    rateLimitStore.set(key, activeAttempts);
    return true;
  }
  activeAttempts.push(now);
  rateLimitStore.set(key, activeAttempts);
  return false;
}

export function requireSameOrganization(sessionOrgId: string | null | undefined, targetOrgId: string | null | undefined) {
  return Boolean(sessionOrgId && targetOrgId && sessionOrgId === targetOrgId);
}

