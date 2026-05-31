import { NextResponse } from "next/server";
import { getRevantaOsManifest } from "@/lib/revanta-os/manifest";

export function GET() {
  const manifest = getRevantaOsManifest();

  return NextResponse.json({
    ok: true,
    system: "revanta-os",
    modules: manifest.totals.modules,
    workflows: manifest.totals.workflows,
    templates: manifest.totals.templates,
    timestamp: new Date().toISOString()
  });
}
