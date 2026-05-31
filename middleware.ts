import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/revanta-os/jwt";

const SESSION_COOKIE = "revanta_session";
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/api/organizations",
  "/api/users",
  "/api/crm",
  "/api/conversations",
  "/api/whatsapp",
  "/api/ai",
  "/api/workflows",
  "/api/finance",
  "/api/contracts",
  "/api/support",
  "/api/notifications",
  "/api/email"
];

function authSecret() {
  return process.env.JWT_SECRET || process.env.REVANTA_JWT_SECRET || "dev-secret-change-me";
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifyJwt(token, authSecret()) : null;
  if (payload) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/organizations/:path*",
    "/api/users/:path*",
    "/api/crm/:path*",
    "/api/conversations/:path*",
    "/api/whatsapp/:path*",
    "/api/ai/:path*",
    "/api/workflows/:path*",
    "/api/finance/:path*",
    "/api/contracts/:path*",
    "/api/support/:path*",
    "/api/notifications/:path*",
    "/api/email/:path*"
  ]
};
