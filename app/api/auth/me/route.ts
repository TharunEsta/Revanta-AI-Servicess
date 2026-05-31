import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user: session });
}

