import { NextRequest, NextResponse } from "next/server";
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

    const response = NextResponse.json({
      ok: true,
      user: {
        id: "admin",
        email: adminEmail,
        name: "Admin"
      }
    });

    response.cookies.set("revanta_session", "admin-session-token", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ ok: false, error: "Login failed" }, { status: 500 });
  }
}
