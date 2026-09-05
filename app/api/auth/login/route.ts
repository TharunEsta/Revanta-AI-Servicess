import { NextRequest, NextResponse } from "next/server";
import { createSessionForUser, sessionCookieOptions } from "@/lib/revanta-os/auth";
import { safeJson } from "@/lib/revanta-os/http";

export async function POST(request: NextRequest) {
  try {
    const body = await safeJson(request);
    const email = (typeof body.email === "string" ? body.email : typeof body.identifier === "string" ? body.identifier : "").trim().toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
    }

    const session = await createSessionForUser({
      userId: "admin",
      email: adminEmail || "admin@example.com",
      name: "Admin",
      orgId: null,
      role: "admin",
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null,
      userAgent: request.headers.get("user-agent")
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: "admin",
        email: adminEmail,
        name: "Admin",
        orgId: null
      }
    });

    response.cookies.set("revanta_session", session.token, {
      ...sessionCookieOptions()
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ ok: false, error: "Login failed" }, { status: 500 });
  }
}
