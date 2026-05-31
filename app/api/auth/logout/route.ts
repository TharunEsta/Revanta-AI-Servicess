import { NextRequest, NextResponse } from "next/server";
import { revokeSessionByToken } from "@/lib/revanta-os/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("revanta_session")?.value;
  if (token) {
    await revokeSessionByToken(token);
  }
  const refreshToken = request.cookies.get("revanta_refresh")?.value;
  if (refreshToken) {
    await revokeSessionByToken(refreshToken);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("revanta_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  response.cookies.set("revanta_refresh", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}
