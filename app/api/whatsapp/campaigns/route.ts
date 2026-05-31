import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { sendWhatsAppTextMessage } from "@/lib/revanta-os/whatsapp";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const campaigns = await prisma.whatsAppCampaign.findMany({
    where: { organizationId: session.orgId },
    include: { template: true, createdBy: true },
    orderBy: { createdAt: "desc" }
  });
  return jsonOk(campaigns);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const body = (await safeJson(request)) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return jsonError("name is required.");

  const audience = body.audience && typeof body.audience === "object" ? (body.audience as Record<string, unknown>) : {};
  const conversationIds = Array.isArray(audience.conversationIds) ? audience.conversationIds.filter((value) => typeof value === "string") as string[] : [];
  const messageBody =
    typeof body.messageBody === "string"
      ? body.messageBody
      : typeof body.templateBody === "string"
        ? body.templateBody
        : "";

  const campaign = await prisma.whatsAppCampaign.create({
    data: {
      organizationId: session.orgId,
      createdById: session.userId,
      templateId: typeof body.templateId === "string" ? body.templateId : null,
      name,
      type: typeof body.type === "string" ? body.type : "BROADCAST",
      audience: body.audience && typeof body.audience === "object" ? (body.audience as object) : undefined,
      messageBody,
      status: "DRAFT",
      scheduledAt: typeof body.scheduledAt === "string" ? new Date(body.scheduledAt) : undefined,
      metadata: body.metadata && typeof body.metadata === "object" ? (body.metadata as object) : undefined
    },
    include: { template: true, createdBy: true }
  });

  if (body.sendNow === true && conversationIds.length > 0) {
    const text = messageBody || campaign.template?.body || "";
    let sentCount = 0;
    let failedCount = 0;
    for (const conversationId of conversationIds) {
      try {
        await sendWhatsAppTextMessage({
          organizationId: session.orgId,
          conversationId,
          text
        });
        sentCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    const updated = await prisma.whatsAppCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        deliveredCount: sentCount,
        failedCount
      },
      include: { template: true, createdBy: true }
    });
    return jsonOk(updated, { status: 201 });
  }

  return jsonOk(campaign, { status: 201 });
}

