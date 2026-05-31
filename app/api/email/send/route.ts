import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { sendEmailTemplate } from "@/lib/revanta-os/email";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const templateName = typeof body.templateName === "string" ? body.templateName.trim() : "";
  const toEmail = typeof body.toEmail === "string" ? body.toEmail.trim().toLowerCase() : "";
  if (!templateName || !toEmail) {
    return jsonError("templateName and toEmail are required.");
  }
  const result = await sendEmailTemplate({
    organizationId: session.orgId,
    name: templateName,
    toEmail,
    variables: body.variables && typeof body.variables === "object" ? (body.variables as Record<string, string>) : {},
    sentById: session.userId
  });
  return jsonOk(result, { status: 201 });
}

