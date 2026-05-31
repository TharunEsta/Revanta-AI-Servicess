import { NextRequest, NextResponse } from "next/server";
import { refreshCookieOptions, refreshSessionFromRequest, sessionCookieOptions } from "@/lib/revanta-os/auth";

export async function POST(request: NextRequest) {
  const refreshed = await refreshSessionFromRequest(request);
  if (!refreshed) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    user: refreshed.session
  });
  response.cookies.set("revanta_session", refreshed.accessToken, {
    ...sessionCookieOptions()
  });
  response.cookies.set("revanta_refresh", refreshed.refreshToken, {
    ...refreshCookieOptions()
  });
  return response;
}

