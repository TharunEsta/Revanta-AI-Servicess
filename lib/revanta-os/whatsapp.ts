import { prisma } from "@/lib/revanta-os/db";
import { toJsonObject, toJsonValue } from "@/lib/revanta-os/json";
import { qualifyLeadWithBrain } from "@/lib/revanta-os/ai";
import { createNotification } from "@/lib/revanta-os/notifications";
import { runAIPrompt } from "@/lib/revanta-os/ai";
import { triggerWorkflowEvent } from "@/lib/revanta-os/workflows";

export function normalizePhone(input: string) {
  return input.replace(/[^\d+]/g, "");
}

function getRetryDelayMinutes(retryCount: number) {
  return Math.min(60, 5 * 2 ** Math.max(0, retryCount));
}

async function findWhatsAppIntegrationByPhoneNumberId(phoneNumberId: string) {
  return prisma.whatsAppIntegration.findFirst({
    where: { phoneNumberId },
    include: { defaultAssignee: true }
  });
}

async function findOrCreateLead(params: {
  organizationId: string;
  phone: string;
  name?: string | null;
  companyName?: string | null;
}) {
  const normalizedPhone = normalizePhone(params.phone);
  const lead = await prisma.lead.findFirst({
    where: {
      organizationId: params.organizationId,
      OR: [{ phone: normalizedPhone }, { phone: params.phone }]
    },
    include: { contact: true, company: true }
  });

  if (lead) {
    return { lead, created: false };
  }

  const created = await prisma.lead.create({
    data: {
      organizationId: params.organizationId,
      fullName: params.name || null,
      companyName: params.companyName || null,
      phone: normalizedPhone,
      source: "WHATSAPP",
      sourceLabel: "WhatsApp",
      status: "NEW",
      notes: "Auto-created from incoming WhatsApp message."
    },
    include: { contact: true, company: true }
  });

  return { lead: created, created: true };
}

async function findOrCreateContact(params: {
  organizationId: string;
  leadId: string;
  phone: string;
  name?: string | null;
  companyId?: string | null;
  autoCreateContacts: boolean;
}) {
  if (!params.autoCreateContacts) {
    return null;
  }

  const existing = await prisma.contact.findFirst({
    where: {
      organizationId: params.organizationId,
      OR: [{ phone: params.phone }, { leadId: params.leadId }]
    }
  });

  if (existing) {
    if (!existing.leadId) {
      return prisma.contact.update({
        where: { id: existing.id },
        data: {
          leadId: params.leadId,
          companyId: params.companyId || existing.companyId || undefined
        }
      });
    }

    return existing;
  }

  return prisma.contact.create({
    data: {
      organizationId: params.organizationId,
      leadId: params.leadId,
      companyId: params.companyId || null,
      fullName: params.name || null,
      phone: params.phone
    }
  });
}

async function findOrCreateConversation(params: {
  organizationId: string;
  leadId: string;
  companyId?: string | null;
  contactId?: string | null;
  subject?: string | null;
  phoneNumberId?: string | null;
  externalId: string;
  threadId: string;
  assignedToId?: string | null;
}) {
  const existing = await prisma.conversation.findFirst({
    where: {
      organizationId: params.organizationId,
      OR: [{ threadId: params.threadId }, { externalId: params.externalId }, { leadId: params.leadId }]
    }
  });

  if (existing) {
    return prisma.conversation.update({
      where: { id: existing.id },
      data: {
        leadId: params.leadId,
        companyId: params.companyId || existing.companyId || undefined,
        contactId: params.contactId || existing.contactId || undefined,
        assignedToId: params.assignedToId || existing.assignedToId || undefined,
        externalId: params.externalId || existing.externalId || undefined,
        threadId: params.threadId || existing.threadId || undefined,
        subject: params.subject || existing.subject || undefined,
        status: "OPEN"
      }
    });
  }

  return prisma.conversation.create({
    data: {
      organizationId: params.organizationId,
      leadId: params.leadId,
      companyId: params.companyId || null,
      contactId: params.contactId || null,
      assignedToId: params.assignedToId || null,
      channel: "WHATSAPP",
      status: "OPEN",
      externalId: params.externalId,
      threadId: params.threadId,
      subject: params.subject || null,
      startedAt: new Date(),
      lastMessageAt: new Date()
    }
  });
}

function getAutoReplyEnabled(settings: unknown) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return true;
  }

  const typedSettings = settings as { autoReplyEnabled?: unknown; aiEnabled?: unknown };
  if (typedSettings.autoReplyEnabled === false) {
    return false;
  }
  if (typedSettings.aiEnabled === false) {
    return false;
  }

  return true;
}

async function logWhatsAppAutomationError(params: {
  organizationId: string;
  conversationId: string;
  leadId?: string | null;
  actorId?: string | null;
  message: string;
  details?: Record<string, unknown>;
}) {
  await prisma.executionLog.create({
    data: {
      organizationId: params.organizationId,
      actorId: params.actorId || null,
      eventType: "WHATSAPP_AUTO_REPLY",
      level: "ERROR",
      message: params.message,
      payload: toJsonValue({
        conversationId: params.conversationId,
        leadId: params.leadId || null,
        ...(params.details || {})
      })
    }
  });
}

async function setConversationMetadata(params: {
  organizationId: string;
  conversationId: string;
  patch: Record<string, unknown>;
}) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: params.conversationId, organizationId: params.organizationId }
  });
  if (!conversation) return;

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: {
      metadata: toJsonValue({
        ...(conversation.metadata ? (toJsonObject(conversation.metadata) as Record<string, unknown>) : {}),
        ...params.patch
      })
    }
  });
}

export async function sendWhatsAppTextMessage(params: {

  organizationId: string;
  conversationId: string;
  text: string;
  metadata?: Record<string, unknown> | null;
}) {
  const integration = await prisma.whatsAppIntegration.findUnique({
    where: { organizationId: params.organizationId }
  });

  if (!integration?.phoneNumberId) {
    throw new Error("WhatsApp phone number ID is not configured for this organization.");
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("WhatsApp access token is not configured.");
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.conversationId, organizationId: params.organizationId },
    include: { lead: true, contact: true }
  });

  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  const recipientPhone = normalizePhone(
    conversation.externalId || conversation.contact?.phone || conversation.lead?.phone || ""
  );
  if (!recipientPhone) {
    throw new Error("Conversation does not have a WhatsApp recipient phone number.");
  }

  const stored = await storeOutgoingWhatsAppMessage({
    organizationId: params.organizationId,
    leadId: conversation.leadId,
    conversationId: conversation.id,
    body: params.text,
    metadata: params.metadata
  });

  const response = await fetch(`https://graph.facebook.com/v19.0/${integration.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "text",
      text: { body: params.text }
    })
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    console.error(
      "[WA_META_ERROR]",
      JSON.stringify(json, null, 2)
    );
    await prisma.message.update({
      where: { id: stored.id },
      data: {
        status: "failed",
        retryCount: stored.retryCount + 1,
        lastFailedAt: new Date(),
        nextRetryAt: new Date(Date.now() + getRetryDelayMinutes(stored.retryCount) * 60 * 1000),
        failureReason: json?.error?.message || "WhatsApp send failed.",
        metadata: toJsonValue({
          ...(stored.metadata ? toJsonObject(stored.metadata) : {}),
          providerError: json || null
        })
      }
    });
    throw new Error(json?.error?.message || "WhatsApp send failed.");
  }

  const externalMessageId = json?.messages?.[0]?.id || stored.externalId || null;
  const updated = await prisma.message.update({
    where: { id: stored.id },
    data: {
      externalId: externalMessageId,
      status: "sent",
      metadata: toJsonValue({
        ...(stored.metadata ? toJsonObject(stored.metadata) : {}),
        providerResponse: json || null
      })
    }
  });

  const messageSource = typeof params.metadata?.source === "string" ? params.metadata.source : "manual";

  await prisma.activity.create({
    data: {
      organizationId: params.organizationId,
      leadId: conversation.leadId,
      companyId: conversation.companyId || undefined,
      type: messageSource === "ai" ? "WHATSAPP_AI_REPLY" : "WHATSAPP_OUTBOUND",
      title: `WhatsApp message sent to ${recipientPhone}`,
      body: params.text,
      metadata: toJsonValue({
        conversationId: conversation.id,
        messageId: updated.id,
        externalMessageId,
        source: messageSource
      })
    }
  });

  await createNotification({
    organizationId: params.organizationId,
    userId: conversation.assignedToId || null,
    type: "WHATSAPP_OUTBOUND",
    title: `WhatsApp message sent to ${recipientPhone}`,
    body: params.text.slice(0, 200),
    metadata: {
      conversationId: conversation.id,
      messageId: updated.id,
      externalMessageId
    }
  });

  await triggerWorkflowEvent({
    organizationId: params.organizationId,
    actorId: conversation.assignedToId || null,
    eventType: "MESSAGE_SENT",
    payload: {
      leadId: conversation.leadId,
      conversationId: conversation.id,
      messageId: updated.id,
      externalMessageId,
      recipientPhone,
      source: messageSource
    }
  });

  return { conversation, message: updated, recipientPhone, externalMessageId };
}

async function storeOutgoingWhatsAppMessage(params: {
  organizationId: string;
  leadId?: string | null;
  conversationId: string;
  body: string;
  externalId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const message = await prisma.message.create({
    data: {
      organizationId: params.organizationId,
      leadId: params.leadId || null,
      conversationId: params.conversationId,
      direction: "OUTBOUND",
      body: params.body,
      externalId: params.externalId || null,
      status: params.externalId ? "sent" : "queued",
      sentAt: new Date(),
      metadata: params.metadata ? toJsonValue(params.metadata) : undefined
    }
  });

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { lastMessageAt: new Date(), status: "OPEN" }
  });

  return message;
}

async function sendWhatsAppInteractiveMessage(params: {
  organizationId: string;
  conversationId: string;
  payload: any;
  metadata?: Record<string, unknown> | null;
}) {
  const integration = await prisma.whatsAppIntegration.findUnique({
    where: { organizationId: params.organizationId }
  });

  if (!integration?.phoneNumberId) {
    throw new Error("WhatsApp phone number ID is not configured for this organization.");
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("WhatsApp access token is not configured.");
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.conversationId, organizationId: params.organizationId },
    include: { lead: true, contact: true }
  });

  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  const recipientPhone = normalizePhone(
    conversation.externalId || conversation.contact?.phone || conversation.lead?.phone || ""
  );
  if (!recipientPhone) {
    throw new Error("Conversation does not have a WhatsApp recipient phone number.");
  }

  const payload = {
    ...params.payload,
    messaging_product: "whatsapp",
    to: recipientPhone
  };

  const stored = await storeOutgoingWhatsAppMessage({
    organizationId: params.organizationId,
    leadId: conversation.leadId,
    conversationId: conversation.id,
    body: typeof payload?.interactive?.body?.text === "string" ? payload.interactive.body.text : "",
    metadata: params.metadata
  });

  console.log("[WA_OUTBOUND_PAYLOAD]", JSON.stringify(payload, null, 2));

  const response = await fetch(`https://graph.facebook.com/v19.0/${integration.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    console.error(
      "[WA_META_ERROR]",
      JSON.stringify(json, null, 2)
    );
    await prisma.message.update({
      where: { id: stored.id },
      data: {
        status: "failed",
        retryCount: stored.retryCount + 1,
        lastFailedAt: new Date(),
        nextRetryAt: new Date(Date.now() + getRetryDelayMinutes(stored.retryCount) * 60 * 1000),
        failureReason: json?.error?.message || "WhatsApp send failed.",
        metadata: toJsonValue({
          ...(stored.metadata ? toJsonObject(stored.metadata) : {}),
          providerError: json || null
        })
      }
    });
    throw new Error(json?.error?.message || "WhatsApp send failed.");
  }

  const externalMessageId = json?.messages?.[0]?.id || stored.externalId || null;
  const updated = await prisma.message.update({
    where: { id: stored.id },
    data: {
      externalId: externalMessageId,
      status: "sent",
      metadata: toJsonValue({
        ...(stored.metadata ? toJsonObject(stored.metadata) : {}),
        providerResponse: json || null
      })
    }
  });

  const messageSource = typeof params.metadata?.source === "string" ? params.metadata.source : "manual";

  await prisma.activity.create({
    data: {
      organizationId: params.organizationId,
      leadId: conversation.leadId,
      companyId: conversation.companyId || undefined,
      type: messageSource === "ai" ? "WHATSAPP_AI_REPLY" : "WHATSAPP_OUTBOUND",
      title: `WhatsApp interactive message sent to ${recipientPhone}`,
      body: updated.body,
      metadata: toJsonValue({
        conversationId: conversation.id,
        messageId: updated.id,
        externalMessageId,
        source: messageSource
      })
    }
  });

  await createNotification({
    organizationId: params.organizationId,
    userId: conversation.assignedToId || null,
    type: "WHATSAPP_OUTBOUND",
    title: `WhatsApp interactive message sent to ${recipientPhone}`,
    body: updated.body.slice(0, 200),
    metadata: {
      conversationId: conversation.id,
      messageId: updated.id,
      externalMessageId
    }
  });

  await triggerWorkflowEvent({
    organizationId: params.organizationId,
    actorId: conversation.assignedToId || null,
    eventType: "MESSAGE_SENT",
    payload: {
      leadId: conversation.leadId,
      conversationId: conversation.id,
      messageId: updated.id,
      externalMessageId,
      recipientPhone,
      source: messageSource
    }
  });

  return { conversation, message: updated, recipientPhone, externalMessageId };
}

async function handleConsultantConversation(params: {
  organizationId: string;
  conversationId: string;
  inboundBody: string;
  actorId?: string | null;
}) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: params.conversationId, organizationId: params.organizationId },
    include: {
      lead: { include: { company: true, contact: true } },
      company: true,
      contact: true,
      messages: { orderBy: { createdAt: "desc" }, take: 12 }
    }
  });

  if (!conversation) {
    return { skipped: true, reason: "Conversation not found" };
  }

  const integration = await prisma.whatsAppIntegration.findUnique({
    where: { organizationId: params.organizationId }
  });

  if (!getAutoReplyEnabled(integration?.settings)) {
    return { skipped: true, reason: "Auto reply disabled" };
  }

  if (conversation.aiState === "HUMAN_ACTIVE" || conversation.humanTakeoverAt) {
    return { skipped: true, reason: "Human takeover active" };
  }

  const lead = conversation.lead;
  const meta = (conversation.metadata || {}) as Record<string, unknown>;

  const language = (typeof meta.language === "string" ? meta.language : "ENGLISH") as "ENGLISH" | "TELUGU";
  const flowStep = typeof meta.flowStep === "string" ? String(meta.flowStep) : "NEW";
  const selectedService = typeof meta.selectedService === "string" ? meta.selectedService : null;

  const now = new Date();
  const customerName =
    lead?.fullName || conversation.contact?.fullName || conversation.company?.name || lead?.companyName || "there";

  const normalized = params.inboundBody.toLowerCase();

  const wantsHuman =
    normalized.includes("price") ||
    normalized.includes("pricing") ||
    normalized.includes("cost") ||
    normalized.includes("quote") ||
    normalized.includes("meeting") ||
    normalized.includes("call") ||
    normalized.includes("talk") ||
    normalized.includes("team") ||
    normalized.includes("founder") ||
    normalized.includes("person") ||
    normalized.includes("representative") ||
    normalized.includes("complex") ||
    normalized.includes("custom");

  if (wantsHuman) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        aiState: "HUMAN_ACTIVE",
        humanTakeoverAt: now,
        metadata: toJsonValue({
          ...(conversation.metadata ? toJsonObject(conversation.metadata) : {}),
          flowStep: "HUMAN",
          lastBotInteraction: now.toISOString(),
          handoffReason: "pricing_or_meeting_or_complex"
        })
      }
    });

    return { skipped: true, reason: "Human takeover requested" };
  }

  const recentMessages = conversation.messages
    .slice()
    .reverse()
    .map((m) => ({ direction: m.direction, body: m.body, createdAt: m.createdAt.toISOString() }));

  if (flowStep === "NEW") {
    const hour = now.getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 16 ? "Good Afternoon" : "Good Evening";

    await setConversationMetadata({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      patch: { language: "ENGLISH", flowStep: "LANGUAGE_SELECTION", lastBotInteraction: now.toISOString() }
    });

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: `${greeting} ${customerName}\n\nWelcome to Revanta AI.\n\nPlease choose your preferred language.`,
      metadata: { source: "consultant", autoReply: true }
    });

    await sendWhatsAppInteractiveMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      payload: {
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: "Select language" },
          action: {
            buttons: [
              { type: "reply", reply: { id: "lang_en", title: "English" } },
              { type: "reply", reply: { id: "lang_te", title: "తెలుగు" } }
            ]
          }
        }
      },
      metadata: { source: "consultant", language: "ENGLISH" }
    });

    return { skipped: false };
  }

  if (flowStep === "LANGUAGE_SELECTION") {
    const nextLanguage = normalized.includes("telugu") || normalized.includes("తెలుగు") ? "TELUGU" : "ENGLISH";

    await setConversationMetadata({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      patch: { language: nextLanguage, flowStep: "DISCOVERY", lastBotInteraction: now.toISOString() }
    });

    const discoveryText =
      nextLanguage === "TELUGU" ? "మీకు Revanta AI ఎలా సహాయం చేయగలదు?" : "How can Revanta AI help you?";

    await sendWhatsAppInteractiveMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      payload: {
        type: "interactive",
        interactive: {
          type: "list",
          body: { text: discoveryText },
          header: { type: "text", text: "Select Service" },
          action: {
            button: "Choose",
            sections: [
              {
                title: "Select Service",
                rows: [
                  {
                    id: "service_automation",
                    title: "Improve Business"
                  },
                  {
                    id: "service_software",
                    title: "Build Software"
                  },
                  {
                    id: "service_ai",
                    title: "AI Agent"
                  },
                  {
                    id: "service_web",
                    title: "Website / App"
                  },
                  {
                    id: "service_crm",
                    title: "CRM System"
                  },
                  {
                    id: "service_iot",
                    title: "IoT / 3D Experience"
                  },
                  {
                    id: "service_team",
                    title: "Talk with Team"
                  }
                ]
              }
            ]
          }
        }
      },
      metadata: { source: "consultant", language: nextLanguage }
    });


    return { skipped: false };
  }

  if (flowStep === "DISCOVERY") {
    // If interactive replies come as plain text, map by keyword.
    let nextService: string | null = selectedService;

    if (!nextService) {
      if (normalized.includes("service_automation")) nextService = "Improve / Automate my business";
      if (normalized.includes("service_software")) nextService = "Build new software idea";
      if (normalized.includes("service_ai")) nextService = "AI Agent / Chatbot";
      if (normalized.includes("service_web")) nextService = "Website / Mobile App";
      if (normalized.includes("service_crm")) nextService = "CRM / Business System";
      if (normalized.includes("service_iot")) nextService = "IoT / Hologram / 3D Experience";
      if (normalized.includes("service_team")) nextService = "Talk with Team";

      // fallback keyword mapping for free-text replies
      if (!nextService) {
        if (normalized.includes("automate") || normalized.includes("business") || normalized.includes("grow")) nextService = "Improve / Automate my business";
        if (normalized.includes("software") || normalized.includes("idea") || normalized.includes("build")) nextService = "Build new software idea";
        if (normalized.includes("agent") || normalized.includes("chatbot") || normalized.includes("ai")) nextService = "AI Agent / Chatbot";
        if (normalized.includes("website") || normalized.includes("mobile") || normalized.includes("app")) nextService = "Website / Mobile App";
        if (normalized.includes("crm") || normalized.includes("system")) nextService = "CRM / Business System";
        if (normalized.includes("iot") || normalized.includes("hologram") || normalized.includes("3d")) nextService = "IoT / Hologram / 3D Experience";
        if (normalized.includes("team") || normalized.includes("talk")) nextService = "Talk with Team";
      }
    }

    if (!nextService) {
      // Re-send discovery buttons
      await sendWhatsAppInteractiveMessage({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        payload: {
          type: "interactive",
          interactive: {
            type: "list",
            header: { type: "text", text: "Select Service" },
            body: { text: nextLanguageBody(language) },
            action: {
              button: "Choose",
              sections: [
                {
                  title: "Select Service",
                  rows: [
                    { id: "service_automation", title: "Improve / Automate my business" },
                    { id: "service_software", title: "Build new software idea" },
                    { id: "service_ai", title: "AI Agent / Chatbot" },
                    { id: "service_web", title: "Website / Mobile App" },
                    { id: "service_crm", title: "CRM / Business System" },
                    { id: "service_iot", title: "IoT / Hologram / 3D Experience" },
                    { id: "service_team", title: "Talk with Team" }
                  ]
                }
              ]
            }
          }
        },
        metadata: { source: "consultant", language }
      });
      return { skipped: false };
    }

    await setConversationMetadata({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      patch: { selectedService: nextService, flowStep: "REQUIREMENT_COLLECTION", lastBotInteraction: now.toISOString() }
    });

    const askIntro =
      language === "TELUGU"
        ? "పరిష్కారం సూచించే ముందు, కొన్ని వివరాలు తెలుసుకోవాలనుకుంటున్నాం.\n\n1) మీరు ఏ బిజినెస్ చేస్తారు?\n2) ప్రస్తుతం మీ పెద్ద సమస్య ఏమిటి?\n3) మీరు కోరుకునే ఫలితం ఏమిటి?"
        : "Before we suggest a solution, we need a few details.\n\n1) What business do you run?\n2) What is the biggest challenge today?\n3) What outcome do you expect?";

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: askIntro,
      metadata: { source: "consultant", autoReply: true, language }
    });

    return { skipped: false };
  }

  if (flowStep === "REQUIREMENT_COLLECTION") {
    // Use AI Brain to extract structured requirement.
    let parsed: Record<string, unknown> = {};
    try {
      const brain = await runAIPrompt({
        organizationId: params.organizationId,
        userId: params.actorId || conversation.assignedToId || null,
        purpose: "reply",
        prompt: JSON.stringify({
          language,
          selectedService,
          inbound: params.inboundBody,
          conversation: { flowStep, recentMessages }
        }),
        parseJson: true,
        system:
          "You are a business consultant for Revanta OS WhatsApp. Extract: businessType, currentProblems (array), expectedOutcome, featuresRequired (array), timeline, referenceRequest (boolean), pricingOrMeeting (boolean), complexRequest (boolean), confidence (0-1). Return JSON only."
      });
      parsed = (brain.parsed || {}) as Record<string, unknown>;
    } catch {
      parsed = {};
    }

    const pricingOrMeeting =
      normalized.includes("price") ||
      normalized.includes("pricing") ||
      normalized.includes("meeting") ||
      normalized.includes("call") ||
      normalized.includes("quote");

    const confidence = typeof parsed.confidence === "number" ? (parsed.confidence as number) : 0.3;

    if (pricingOrMeeting || confidence < 0.25) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          aiState: "HUMAN_ACTIVE",
          humanTakeoverAt: now,
          metadata: toJsonValue({
            ...(conversation.metadata ? toJsonObject(conversation.metadata) : {}),
            flowStep: "HUMAN",
            lastBotInteraction: now.toISOString(),
            handoffReason: "pricing_or_low_confidence"
          })
        }
      });
      return { skipped: true, reason: "Human takeover requested" };
    }

    const problems = Array.isArray(parsed.currentProblems)
      ? (parsed.currentProblems as unknown[]).filter((x) => typeof x === "string").join(", ")
      : null;
    const outcome = typeof parsed.expectedOutcome === "string" ? (parsed.expectedOutcome as string) : null;

    const consultantText =
      language === "TELUGU"
        ? `మీ అవసరాన్ని బట్టి, మీ ప్రధాన సవాల్: ${problems || "(స్పష్టంగా తెలియడం లేదు)"}.\nమీకు కావాల్సిన ఫలితం: ${outcome || "(స్పష్టంగా తెలియడం లేదు)"}.\n\nఇప్పుడు మీకు కావాల్సిన ఫీచర్లు/సామర్థ్యాలు ఏవి?`
        : `Based on what you shared, your current pain points: ${problems || "(not fully specified)"}.\nExpected outcome: ${outcome || "(not fully specified)"}.\n\nWhat features do you need?`;

    await setConversationMetadata({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      patch: { flowStep: "CONSULTATION", lastBotInteraction: now.toISOString() }
    });

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: consultantText,
      metadata: { source: "consultant", autoReply: true, language }
    });

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text:
        language === "TELUGU"
          ? "మీకు ఇష్టమైన రిఫరెన్స్ యాప్/వెబ్‌సైట్/ఉదాహరణ ఏమైనా ఉన్నాయా? లింక్ లేదా స్క్రీన్‌షాట్ పంపండి."
          : "Do you have any reference app, website, or example you like? You can share link or screenshot.",
      metadata: { source: "consultant", autoReply: true, language }
    });

    return { skipped: false };
  }

  // CONSULTATION or fallback
  if (flowStep === "CONSULTATION") {
    await setConversationMetadata({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      patch: { lastBotInteraction: now.toISOString() }
    });

    const follow =
      language === "TELUGU"
        ? "అద్భుతం. తదుపరి దశగా, మీ టైమ్‌లైన్ మరియు కావాల్సిన ముఖ్య ఫీచర్లపై కాస్త వివరించండి."
        : "Great. Next, share your timeline and the key features you want.";

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: follow,
      metadata: { source: "consultant", autoReply: true, language }
    });

    return { skipped: false };
  }

  await setConversationMetadata({
    organizationId: params.organizationId,
    conversationId: conversation.id,
    patch: { flowStep: "DISCOVERY", lastBotInteraction: now.toISOString() }
  });

  return handleConsultantConversation({
    organizationId: params.organizationId,
    conversationId: params.conversationId,
    inboundBody: params.inboundBody,
    actorId: params.actorId
  });
}

function nextLanguageBody(language: "ENGLISH" | "TELUGU") {
  return language === "TELUGU" ? "మీకు Revanta AI ఎలా సహాయం చేయగలదు?" : "How can Revanta AI help you?";
}

async function sendAutomaticWhatsAppReply(params: {
  organizationId: string;
  conversationId: string;
  inboundBody: string;
  actorId?: string | null;
}) {
  return handleConsultantConversation(params);
}

function extractInboundInteractiveId(messagePayload: any): string | null {
  const textBody = messagePayload?.text?.body;
  if (typeof textBody === "string") return textBody;

  const buttonReplyId = messagePayload?.interactive?.button_reply?.id;
  if (typeof buttonReplyId === "string") return buttonReplyId;

  const buttonReplyTitle = messagePayload?.interactive?.button_reply?.title;
  if (typeof buttonReplyTitle === "string") return buttonReplyTitle;

  const listReplyId = messagePayload?.interactive?.list_reply?.id;
  if (typeof listReplyId === "string") return listReplyId;

  const listReplyTitle = messagePayload?.interactive?.list_reply?.title;
  if (typeof listReplyTitle === "string") return listReplyTitle;

  return null;
}

export async function processIncomingWhatsAppMessage(params: {
  organizationId: string;
  from: string;
  body: string;
  messageId?: string;
  name?: string;
  phoneNumberId?: string | null;
  waId?: string | null;
}) {

  const phone = normalizePhone(params.from);
  const integration = await prisma.whatsAppIntegration.findUnique({
    where: { organizationId: params.organizationId },
    include: { defaultAssignee: true }
  });

  const { lead, created } = await findOrCreateLead({
    organizationId: params.organizationId,
    phone,
    name: params.name || null
  });

  const contact = await findOrCreateContact({
    organizationId: params.organizationId,
    leadId: lead.id,
    phone,
    name: params.name || lead.fullName || null,
    companyId: lead.companyId,
    autoCreateContacts: integration?.autoCreateContacts ?? true
  });

  const assignedToId = lead.ownerId || integration?.defaultAssigneeId || null;
  const threadId = `${params.phoneNumberId || integration?.phoneNumberId || "whatsapp"}:${params.waId || phone}`;

  if (!lead.ownerId && assignedToId) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { ownerId: assignedToId }
    });
  }

  const conversation = await findOrCreateConversation({
    organizationId: params.organizationId,
    leadId: lead.id,
    companyId: lead.companyId,
    contactId: contact?.id || lead.contact?.id || null,
    subject: lead.companyName || lead.fullName || params.name || phone,
    phoneNumberId: params.phoneNumberId || integration?.phoneNumberId || null,
    externalId: phone,
    threadId,
    assignedToId
  });

  const message = await prisma.message.create({
    data: {
      organizationId: params.organizationId,
      conversationId: conversation.id,
      leadId: lead.id,
      direction: "INBOUND",
      body: params.body,
      externalId: params.messageId ?? null,
      status: "received",
      sentAt: new Date(),
      metadata: toJsonValue({
        from: params.from,
        name: params.name || null,
        waId: params.waId || phone,
        phoneNumberId: params.phoneNumberId || integration?.phoneNumberId || null
      })
    }
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: lead.status === "NEW" ? "CONTACTED" : lead.status,
      lastActivityAt: new Date()
    }
  });

  if (created) {
    const qualification = await qualifyLeadWithBrain({
      organizationId: params.organizationId,
      userId: assignedToId || null,
      lead: {
        id: lead.id,
        companyName: lead.companyName,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        website: lead.website,
        category: lead.category,
        sourceLabel: lead.sourceLabel,
        notes: lead.notes,
        status: lead.status,
        score: lead.score,
        enrichment: lead.enrichment,
        aiSummary: null
      },
      conversationContext: params.body
    });
    const parsedQualification = (qualification.parsed || {}) as Record<string, unknown>;

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        score: typeof parsedQualification.score === "number" ? parsedQualification.score : lead.score,
        intent: typeof parsedQualification.intent === "string" ? parsedQualification.intent : undefined,
        industry: typeof parsedQualification.industry === "string" ? parsedQualification.industry : undefined,
        recommendedService:
          typeof parsedQualification.recommendedService === "string" ? parsedQualification.recommendedService : undefined,
        qualificationNotes:
          typeof parsedQualification.qualificationNotes === "string" ? parsedQualification.qualificationNotes : undefined,
        nextBestAction:
          typeof parsedQualification.nextBestAction === "string" ? parsedQualification.nextBestAction : undefined,
        aiQualifiedAt: new Date(),
        enrichment: toJsonValue({
          ...toJsonObject(lead.enrichment),
          aiQualification: parsedQualification
        })
      }
    });
  }

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      status: "OPEN"
    }
  });

  await prisma.activity.create({
    data: {
      organizationId: params.organizationId,
      actorId: assignedToId,
      leadId: lead.id,
      companyId: lead.companyId || undefined,
      type: "WHATSAPP_INBOUND",
      title: `WhatsApp message received from ${params.from}`,
      body: params.body,
      metadata: {
        conversationId: conversation.id,
        messageId: message.id
      }
    }
  });

  await createNotification({
    organizationId: params.organizationId,
    userId: assignedToId,
    type: "WHATSAPP_MESSAGE",
    title: `New WhatsApp message from ${params.from}`,
    body: params.body.slice(0, 200),
    metadata: {
      conversationId: conversation.id,
      leadId: lead.id,
      messageId: message.id
    }
  });

  await triggerWorkflowEvent({
    organizationId: params.organizationId,
    actorId: assignedToId,
    eventType: "MESSAGE_RECEIVED",
    payload: {
      leadId: lead.id,
      contactId: contact?.id || null,
      conversationId: conversation.id,
      messageId: message.id,
      from: params.from,
      body: params.body,
      name: params.name || null,
      phoneNumberId: params.phoneNumberId || integration?.phoneNumberId || null
    }
  });

  const autoReply = await sendAutomaticWhatsAppReply({
    organizationId: params.organizationId,
    conversationId: conversation.id,
    inboundBody: params.body,
    actorId: assignedToId
  });

  return { lead, contact, conversation, message, autoReply };
}

// removed duplicate storeOutgoingWhatsAppMessage implementation



export async function recordWhatsAppStatusUpdate(params: {
  organizationId: string;
  externalMessageId: string;
  status: string;
  timestamp?: Date;
}) {
  const message = await prisma.message.findFirst({
    where: {
      organizationId: params.organizationId,
      externalId: params.externalMessageId
    },
    include: { conversation: true, lead: true }
  });

  if (!message) {
    return null;
  }

  const timestamp = params.timestamp || new Date();
  const data: {
    status: string;
    deliveredAt?: Date;
    readAt?: Date;
    sentAt?: Date;
    retryCount?: number;
    nextRetryAt?: Date;
    lastFailedAt?: Date;
    failureReason?: string;
  } = {
    status: params.status
  };

  if (params.status === "sent") {
    data.sentAt = message.sentAt || timestamp;
  }
  if (params.status === "delivered") {
    data.deliveredAt = timestamp;
  }
  if (params.status === "read") {
    data.readAt = timestamp;
  }
  if (params.status === "failed") {
    data.retryCount = message.retryCount + 1;
    data.nextRetryAt = new Date(timestamp.getTime() + getRetryDelayMinutes(message.retryCount) * 60 * 1000);
    data.lastFailedAt = timestamp;
    data.failureReason = "Meta Cloud API delivery failure";
  }

  const updated = await prisma.message.update({
    where: { id: message.id },
    data
  });

  await prisma.activity.create({
    data: {
      organizationId: params.organizationId,
      leadId: message.leadId || undefined,
      companyId: message.conversation.companyId || undefined,
      type: "WHATSAPP_STATUS",
      title: `WhatsApp message marked ${params.status}`,
      body: `Message ${message.externalId || message.id} is ${params.status}`,
      metadata: {
        messageId: message.id,
        conversationId: message.conversationId,
        status: params.status
      }
    }
  });

  return updated;
}

export async function getWhatsAppMetrics(organizationId: string) {
  const [integration, conversations, messages, delivered, read, failed, templates, recentMessages] = await Promise.all([
    prisma.whatsAppIntegration.findUnique({
      where: { organizationId },
      include: { defaultAssignee: true }
    }),
    prisma.conversation.count({ where: { organizationId, channel: "WHATSAPP" } }),
    prisma.message.count({ where: { organizationId, conversation: { channel: "WHATSAPP" } } }),
    prisma.message.count({ where: { organizationId, conversation: { channel: "WHATSAPP" }, status: "delivered" } }),
    prisma.message.count({ where: { organizationId, conversation: { channel: "WHATSAPP" }, status: "read" } }),
    prisma.message.count({ where: { organizationId, conversation: { channel: "WHATSAPP" }, status: "failed" } }),
    prisma.whatsAppTemplate.count({ where: { organizationId } }),
    prisma.message.findMany({
      where: { organizationId, conversation: { channel: "WHATSAPP" } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        conversation: {
          include: {
            lead: true,
            contact: true,
            assignedTo: true
          }
        }
      }
    })
  ]);

  return {
    integration,
    conversations,
    messages,
    delivered,
    read,
    failed,
    templates,
    recentMessages
  };
}

export async function resolveOrganizationFromPhoneNumberId(phoneNumberId: string) {
  const integration = await findWhatsAppIntegrationByPhoneNumberId(phoneNumberId);
  return integration?.organizationId || null;
}

