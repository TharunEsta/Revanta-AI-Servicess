import { NextResponse } from "next/server";
import { getRevantaOsManifest } from "@/lib/revanta-os/manifest";

export function GET() {
  return NextResponse.json(getRevantaOsManifest(), {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
