import { prisma } from "@/lib/revanta-os/db";
import { toJsonObject, toJsonValue } from "@/lib/revanta-os/json";
import { qualifyLeadWithBrain } from "@/lib/revanta-os/ai";
import { createNotification } from "@/lib/revanta-os/notifications";
import { runAIPrompt } from "@/lib/revanta-os/ai";
import { triggerWorkflowEvent } from "@/lib/revanta-os/workflows";
import {
  buildCalendlyDiscoveryCallMessage,
  getCalendlyBookingUrl,
  hasCalendlyMeetingIntent
} from "@/lib/revanta-os/calendly";

export function normalizePhone(input: string) {
  return input.replace(/[^\d+]/g, "");
}

function getRetryDelayMinutes(retryCount: number) {
  return Math.min(60, 5 * 2 ** Math.max(0, retryCount));
}

const MEETING_LINK_PATTERNS = [
  /https?:\/\/meet\.google\.com\/[^\s]+/i,
  /https?:\/\/(?:[\w-]+\.)?zoom\.us\/[^\s]+/i,
  /https?:\/\/teams\.microsoft\.com\/[^\s]+/i,
  /https?:\/\/calendly\.com\/[^\s]+/i
];

function extractMeetingLink(text: string) {
  for (const pattern of MEETING_LINK_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

function buildHumanHandoffMessage(language: "ENGLISH" | "TELUGU", bookingUrl?: string | null) {
  if (language === "TELUGU") {
    return bookingUrl
      ? `ధన్యవాదాలు. మీ అభ్యర్థనను మా టీమ్‌కు పంపించాము.\n\nమీకు సౌకర్యంగా ఉంటే ఈ లింక్‌లో డిస్కవరీ కాల్ బుక్ చేసుకోవచ్చు:\n${bookingUrl}`
      : "ధన్యవాదాలు. మీ అభ్యర్థనను మా టీమ్‌కు పంపించాము. మా టీమ్ త్వరలో మీతో సంప్రదిస్తుంది.";
  }

  return bookingUrl
    ? `Thanks for sharing the details. I have routed this to our team.\n\nYou can also book a discovery call here:\n${bookingUrl}`
    : "Thanks for sharing the details. I have routed this to our team, and someone will follow up with you shortly.";
}

function buildMeetingLinkAcknowledgementMessage(params: {
  language: "ENGLISH" | "TELUGU";
  sharedLink: string;
  bookingUrl?: string | null;
}) {
  if (params.language === "TELUGU") {
    return params.bookingUrl
      ? `మీరు మీటింగ్ లింక్ షేర్ చేసినందుకు ధన్యవాదాలు.\n${params.sharedLink}\n\nమా టీమ్ దీనిని సమీక్షిస్తుంది. మీరు ఇష్టపడితే మా డిస్కవరీ కాల్‌ను కూడా ఇక్కడ బుక్ చేసుకోవచ్చు:\n${params.bookingUrl}`
      : `మీరు మీటింగ్ లింక్ షేర్ చేసినందుకు ధన్యవాదాలు.\n${params.sharedLink}\n\nమా టీమ్ దీనిని సమీక్షించి త్వరలో మీతో సంప్రదిస్తుంది.`;
  }

  return params.bookingUrl
    ? `Thanks for sharing the meeting link:\n${params.sharedLink}\n\nOur team will review it. If you prefer, you can also book directly on our calendar here:\n${params.bookingUrl}`
    : `Thanks for sharing the meeting link:\n${params.sharedLink}\n\nOur team will review it and get back to you shortly.`;
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

async function writeConversationLog(params: {
  organizationId: string;
  actorId?: string | null;
  eventType: string;
  message: string;
  payload?: Record<string, unknown>;
  level?: "INFO" | "WARN" | "ERROR" | "SUCCESS";
}) {
  await prisma.executionLog.create({
    data: {
      organizationId: params.organizationId,
      actorId: params.actorId || null,
      eventType: params.eventType,
      level: params.level || "INFO",
      message: params.message,
      payload: params.payload ? toJsonValue(params.payload) : undefined
    }
  });
}

async function transitionConversationState(params: {
  organizationId: string;
  conversationId: string;
  toState: string;
  actorId?: string | null;
  reason?: string;
  patch?: Record<string, unknown>;
  aiState?: "AI_ACTIVE" | "HUMAN_ACTIVE";
  humanTakeoverAt?: Date | null;
  status?: "OPEN" | "PENDING" | "CLOSED" | "ARCHIVED";
}) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: params.conversationId, organizationId: params.organizationId }
  });
  if (!conversation) {
    return { fromState: "UNKNOWN", toState: params.toState };
  }

  const currentMetadata = conversation.metadata ? toJsonObject(conversation.metadata) : {};
  const fromState =
    typeof currentMetadata.flowStep === "string" ? String(currentMetadata.flowStep) : "NEW";
  const nextMetadata = {
    ...currentMetadata,
    ...(params.patch || {}),
    flowStep: params.toState,
    lastBotInteraction:
      typeof params.patch?.lastBotInteraction === "string"
        ? params.patch.lastBotInteraction
        : new Date().toISOString()
  };

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: {
      metadata: toJsonValue(nextMetadata),
      aiState: params.aiState,
      humanTakeoverAt:
        params.humanTakeoverAt !== undefined ? params.humanTakeoverAt : undefined,
      status: params.status
    }
  });

  await writeConversationLog({
    organizationId: params.organizationId,
    actorId: params.actorId || null,
    eventType: "WHATSAPP_STATE_CHANGE",
    message: `[STATE_CHANGE] conversationId=${params.conversationId} from=${fromState} to=${params.toState}`,
    payload: {
      conversationId: params.conversationId,
      fromState,
      toState: params.toState,
      reason: params.reason || null
    }
  });

  return { fromState, toState: params.toState };
}

const REMINDER_DELAY_MINUTES = 5;

async function scheduleConversationReminder(params: {
  organizationId: string;
  conversationId: string;
  leadId?: string | null;
  reminderType: string;
  scheduledFor: Date;
  actorId?: string | null;
}) {
  const pendingReminder = await prisma.conversationReminder.findFirst({
    where: {
      organizationId: params.organizationId,
      conversationId: params.conversationId,
      reminderType: params.reminderType,
      sentAt: null,
      cancelledAt: null
    }
  });

  const reminder = pendingReminder
    ? await prisma.conversationReminder.update({
        where: { id: pendingReminder.id },
        data: {
          leadId: params.leadId || pendingReminder.leadId || null,
          scheduledFor: params.scheduledFor,
          sentAt: null,
          cancelledAt: null
        }
      })
    : await prisma.conversationReminder.create({
        data: {
          organizationId: params.organizationId,
          conversationId: params.conversationId,
          leadId: params.leadId || null,
          reminderType: params.reminderType,
          scheduledFor: params.scheduledFor
        }
      });

  await prisma.executionLog.create({
    data: {
      organizationId: params.organizationId,
      actorId: params.actorId || null,
      eventType: "WHATSAPP_REMINDER_SCHEDULED",
      level: "INFO",
      message: `[REMINDER_SCHEDULED] reminderId=${reminder.id} conversationId=${params.conversationId} reminderType=${params.reminderType}`,
      payload: toJsonValue({
        reminderId: reminder.id,
        conversationId: params.conversationId,
        reminderType: params.reminderType,
        scheduledFor: params.scheduledFor.toISOString()
      })
    }
  });

  return reminder;
}

async function cancelPendingConversationReminders(params: {
  organizationId: string;
  conversationId: string;
  actorId?: string | null;
}) {
  const result = await prisma.conversationReminder.updateMany({
    where: {
      organizationId: params.organizationId,
      conversationId: params.conversationId,
      sentAt: null,
      cancelledAt: null
    },
    data: {
      cancelledAt: new Date()
    }
  });

  if (result.count > 0) {
    await prisma.executionLog.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.actorId || null,
        eventType: "WHATSAPP_REMINDER_CANCELLED",
        level: "INFO",
        message: `[REMINDER_CANCELLED] conversationId=${params.conversationId} count=${result.count}`,
        payload: toJsonValue({
          conversationId: params.conversationId,
          cancelledCount: result.count
        })
      }
    });
  }

  return result.count;
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
      messages: { orderBy: { createdAt: 'desc' }, take: 12 }
    }
  });

  if (!conversation) {
    return { skipped: true, reason: 'Conversation not found' };
  }

  const integration = await prisma.whatsAppIntegration.findUnique({
    where: { organizationId: params.organizationId }
  });

  const lead = conversation.lead;
  const meta = (conversation.metadata || {}) as Record<string, unknown>;
  const language = (typeof meta.language === 'string' ? meta.language : 'ENGLISH') as 'ENGLISH' | 'TELUGU';
  let flowStep = typeof meta.flowStep === 'string' ? String(meta.flowStep) : 'NEW';
  const selectedService = typeof meta.selectedService === 'string' ? meta.selectedService : null;
  const now = new Date();
  const customerName =
    lead?.fullName || conversation.contact?.fullName || conversation.company?.name || lead?.companyName || 'there';
  const normalized = params.inboundBody.toLowerCase();
  const calendlyBookingUrl = getCalendlyBookingUrl();
  const meetingIntent = hasCalendlyMeetingIntent(params.inboundBody);
  const sharedMeetingLink = extractMeetingLink(params.inboundBody);
  const pricingIntent =
    normalized.includes('price') ||
    normalized.includes('pricing') ||
    normalized.includes('cost') ||
    normalized.includes('quote');
  const activeFlowStep = flowStep;

  await writeConversationLog({
    organizationId: params.organizationId,
    actorId: params.actorId || null,
    eventType: "WHATSAPP_FLOW_ENTER",
    message: `[FLOW_ENTER] conversationId=${conversation.id} flow=${activeFlowStep}`,
    payload: {
      conversationId: conversation.id,
      flowStep: activeFlowStep,
      aiState: conversation.aiState,
      inboundBody: params.inboundBody
    }
  });

  const exitFlow = async (result: { skipped: boolean; reason?: string; outcome?: string }, extra?: Record<string, unknown>) => {
    await writeConversationLog({
      organizationId: params.organizationId,
      actorId: params.actorId || null,
      eventType: "WHATSAPP_FLOW_EXIT",
      message: `[FLOW_EXIT] conversationId=${conversation.id} flow=${activeFlowStep} outcome=${result.outcome || result.reason || (result.skipped ? "skipped" : "completed")}`,
      payload: {
        conversationId: conversation.id,
        flowStep: activeFlowStep,
        skipped: result.skipped,
        reason: result.reason || null,
        outcome: result.outcome || null,
        ...(extra || {})
      }
    });

    return result;
  };

  if (!getAutoReplyEnabled(integration?.settings)) {
    await transitionConversationState({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      toState: 'HUMAN',
      reason: 'auto_reply_disabled',
      aiState: 'HUMAN_ACTIVE',
      humanTakeoverAt: now,
      status: 'PENDING',
      patch: {
        handoffReason: 'auto_reply_disabled',
        flowOutcome: 'awaiting_human_followup'
      }
    });

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: buildHumanHandoffMessage(language, null),
      metadata: {
        source: 'consultant',
        autoReply: false,
        language,
        handoffReason: 'auto_reply_disabled'
      }
    });

    await writeConversationLog({
      organizationId: params.organizationId,
      actorId: params.actorId || null,
      eventType: "WHATSAPP_HUMAN_HANDOFF",
      message: `[HUMAN_HANDOFF] conversationId=${conversation.id}`,
      payload: {
        conversationId: conversation.id,
        handoffReason: 'auto_reply_disabled'
      }
    });

    return exitFlow({ skipped: false, outcome: 'manual_mode_handoff_notified' });
  }

  if (conversation.aiState === 'HUMAN_ACTIVE' || conversation.humanTakeoverAt) {
    if (!sharedMeetingLink) {
      return exitFlow({ skipped: true, reason: 'Human takeover active', outcome: 'awaiting_human_followup' });
    }
  }

  const wantsHuman =
    normalized.includes('meeting') ||
    normalized.includes('call') ||
    normalized.includes('talk') ||
    normalized.includes('team') ||
    normalized.includes('founder') ||
    normalized.includes('person') ||
    normalized.includes('representative') ||
    normalized.includes('complex') ||
    normalized.includes('custom');

  if (sharedMeetingLink) {
    await prisma.executionLog.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.actorId || null,
        eventType: "WHATSAPP_MEETING_LINK",
        level: "INFO",
        message: `[MEETING_LINK_DETECTED] conversationId=${conversation.id}`,
        payload: toJsonValue({
          conversationId: conversation.id,
          sharedMeetingLink
        })
      }
    });

    await transitionConversationState({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      toState: 'BOOK_DISCOVERY_CALL',
      reason: 'meeting_link_detected',
      patch: {
        flowStep: 'BOOK_DISCOVERY_CALL',
        lastBotInteraction: now.toISOString(),
        sharedMeetingLink,
        calendlyBookingUrl
      }
    });

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: buildMeetingLinkAcknowledgementMessage({
        language,
        sharedLink: sharedMeetingLink,
        bookingUrl: calendlyBookingUrl
      }),
      metadata: {
        source: 'consultant',
        autoReply: true,
        language,
        sharedMeetingLink,
        calendlyBookingUrl
      }
    });

    return exitFlow({ skipped: false, outcome: 'meeting_link_acknowledged' }, { sharedMeetingLink });
  }

  if (pricingIntent) {
    if (calendlyBookingUrl) {
      await transitionConversationState({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        actorId: params.actorId,
        toState: 'BOOK_DISCOVERY_CALL',
        reason: 'pricing_intent_detected',
        patch: {
          calendlyBookingUrl,
          flowOutcome: 'awaiting_booking'
        }
      });

      await sendWhatsAppTextMessage({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        text:
          language === 'TELUGU'
            ? `ధరలు మీ అవసరాలపై ఆధారపడి ఉంటాయి. సరైన పరిధి చెప్పేందుకు చిన్న డిస్కవరీ కాల్ ఉత్తమ మార్గం.\n\n${buildCalendlyDiscoveryCallMessage(calendlyBookingUrl)!}`
            : `Pricing depends on your exact scope, timeline, and features. The best next step is a short discovery call so we can give the right recommendation.\n\n${buildCalendlyDiscoveryCallMessage(calendlyBookingUrl)!}`,
        metadata: {
          source: 'consultant',
          autoReply: true,
          language,
          calendlyBookingUrl,
          pricingIntent: true
        }
      });

      await writeConversationLog({
        organizationId: params.organizationId,
        actorId: params.actorId || null,
        eventType: "WHATSAPP_QUALIFIED",
        message: `[QUALIFIED] conversationId=${conversation.id}`,
        payload: {
          conversationId: conversation.id,
          qualificationPath: 'pricing_intent',
          selectedService
        }
      });

      await writeConversationLog({
        organizationId: params.organizationId,
        actorId: params.actorId || null,
        eventType: "WHATSAPP_CALENDLY_OFFERED",
        message: `[CALENDLY_OFFERED] conversationId=${conversation.id}`,
        payload: {
          conversationId: conversation.id,
          calendlyBookingUrl,
          qualificationPath: 'pricing_intent'
        }
      });

      await scheduleConversationReminder({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        leadId: conversation.leadId,
        reminderType: 'BOOK_DISCOVERY_CALL',
        scheduledFor: new Date(now.getTime() + REMINDER_DELAY_MINUTES * 60 * 1000),
        actorId: params.actorId
      });

      return exitFlow({ skipped: false, outcome: 'pricing_qualified_and_calendly_offered' });
    }

    await transitionConversationState({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      toState: 'HUMAN',
      reason: 'pricing_intent_without_calendly',
      aiState: 'HUMAN_ACTIVE',
      humanTakeoverAt: now,
      status: 'PENDING',
      patch: {
        handoffReason: 'pricing_intent_without_calendly',
        flowOutcome: 'awaiting_human_followup'
      }
    });

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: buildHumanHandoffMessage(language, null),
      metadata: {
        source: 'consultant',
        autoReply: true,
        language,
        handoffReason: 'pricing_intent_without_calendly'
      }
    });

    await writeConversationLog({
      organizationId: params.organizationId,
      actorId: params.actorId || null,
      eventType: "WHATSAPP_HUMAN_HANDOFF",
      message: `[HUMAN_HANDOFF] conversationId=${conversation.id}`,
      payload: {
        conversationId: conversation.id,
        handoffReason: 'pricing_intent_without_calendly'
      }
    });

    return exitFlow({ skipped: false, outcome: 'pricing_handoff_notified' });
  }

  if (meetingIntent && calendlyBookingUrl) {
    await transitionConversationState({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      toState: 'BOOK_DISCOVERY_CALL',
      reason: 'meeting_intent_detected',
      patch: {
        flowStep: 'BOOK_DISCOVERY_CALL',
        lastBotInteraction: now.toISOString(),
        calendlyBookingUrl
      }
    });

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: buildCalendlyDiscoveryCallMessage(calendlyBookingUrl)!,
      metadata: { source: 'consultant', autoReply: true, language, calendlyBookingUrl }
    });

    await writeConversationLog({
      organizationId: params.organizationId,
      actorId: params.actorId || null,
      eventType: "WHATSAPP_CALENDLY_OFFERED",
      message: `[CALENDLY_OFFERED] conversationId=${conversation.id}`,
      payload: {
        conversationId: conversation.id,
        flowStep: 'BOOK_DISCOVERY_CALL',
        calendlyBookingUrl
      }
    });

    return exitFlow({ skipped: false, outcome: 'calendly_offered' });
  }

  if (wantsHuman) {
    await transitionConversationState({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      toState: 'HUMAN',
      reason: 'pricing_or_meeting_or_complex',
      aiState: 'HUMAN_ACTIVE',
      humanTakeoverAt: now,
      status: 'PENDING',
      patch: {
        handoffReason: 'pricing_or_meeting_or_complex'
      }
    });

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: buildHumanHandoffMessage(language, calendlyBookingUrl),
      metadata: {
        source: 'consultant',
        autoReply: true,
        language,
        handoffReason: 'pricing_or_meeting_or_complex',
        calendlyBookingUrl
      }
    });

    await writeConversationLog({
      organizationId: params.organizationId,
      actorId: params.actorId || null,
      eventType: "WHATSAPP_HUMAN_HANDOFF",
      message: `[HUMAN_HANDOFF] conversationId=${conversation.id}`,
      payload: {
        conversationId: conversation.id,
        handoffReason: 'pricing_or_meeting_or_complex',
        calendlyBookingUrl
      }
    });

    return exitFlow({ skipped: false, reason: 'Human takeover requested', outcome: 'human_handoff_notified' });
  }

  const recentMessages = conversation.messages
    .slice()
    .reverse()
    .map((message: any) => ({ direction: message.direction, body: message.body, createdAt: message.createdAt.toISOString() }));

  if (meta.flowStep === 'LANGUAGE_SELECTION') {
    flowStep = 'DISCOVERY';
    await transitionConversationState({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      toState: 'DISCOVERY',
      reason: 'language_defaulted_to_english',
      patch: { language: 'ENGLISH' }
    });
  }

  if (flowStep === 'NEW') {
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 16 ? 'Good Afternoon' : 'Good Evening';

    await transitionConversationState({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      toState: 'DISCOVERY',
      reason: 'initial_greeting',
      patch: { language: 'ENGLISH' }
    });

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: greeting + ' ' + customerName + '\n\nWelcome to Revanta AI.\n\nHow can Revanta AI help you?',
      metadata: { source: 'consultant', autoReply: true, language: 'ENGLISH' }
    });

    await scheduleConversationReminder({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      leadId: conversation.leadId,
      reminderType: 'DISCOVERY',
      scheduledFor: new Date(now.getTime() + REMINDER_DELAY_MINUTES * 60 * 1000),
      actorId: params.actorId
    });

    return exitFlow({ skipped: false, outcome: 'greeting_sent' });
  }

  if (flowStep === 'DISCOVERY') {
    let nextService: string | null = selectedService;

    if (!nextService) {
      if (normalized.includes('service_business')) nextService = 'Improve / Automate my business';
      if (normalized.includes('service_ai')) nextService = 'AI Agent / Chatbot';
      if (normalized.includes('service_software')) nextService = 'Build new software idea';
      if (normalized.includes('service_automation')) nextService = 'Improve / Automate my business';
      if (normalized.includes('service_web')) nextService = 'Website / Mobile App';
      if (normalized.includes('service_crm')) nextService = 'CRM / Business System';
      if (normalized.includes('service_iot')) nextService = 'IoT / Hologram / 3D Experience';
      if (normalized.includes('service_team')) nextService = 'Talk with Team';

      if (!nextService) {
        if (normalized.includes('ai agent') || normalized.includes('ai')) nextService = 'AI Agent / Chatbot';
        if (normalized.includes('build software') || (normalized.includes('build') && normalized.includes('software')) || normalized.includes('build')) {
          nextService = 'Build new software idea';
        }
        if (normalized.includes('improve business') || normalized.includes('improve') || normalized.includes('automate')) {
          nextService = 'Improve / Automate my business';
        }
      }

      if (!nextService) {
        if (normalized.includes('automate') || normalized.includes('business') || normalized.includes('grow')) nextService = 'Improve / Automate my business';
        if (normalized.includes('software') || normalized.includes('idea') || normalized.includes('build')) nextService = 'Build new software idea';
        if (normalized.includes('agent') || normalized.includes('chatbot') || normalized.includes('ai')) nextService = 'AI Agent / Chatbot';
        if (normalized.includes('website') || normalized.includes('mobile') || normalized.includes('app')) nextService = 'Website / Mobile App';
        if (normalized.includes('crm') || normalized.includes('system')) nextService = 'CRM / Business System';
        if (normalized.includes('iot') || normalized.includes('hologram') || normalized.includes('3d')) nextService = 'IoT / Hologram / 3D Experience';
        if (normalized.includes('team') || normalized.includes('talk')) nextService = 'Talk with Team';
      }
    }

    const flowStepBefore = flowStep;
    const selectedServiceBefore = selectedService;

    console.log('[DISCOVERY]', {
      flowStepBefore,
      selectedServiceBefore,
      incomingBody: params.inboundBody,
      nextService,
      flowStepAfter: nextService ? 'REQUIREMENT_COLLECTION' : flowStep,
      selectedServiceAfter: nextService || selectedService
    });

    if (!nextService) {
      await sendWhatsAppInteractiveMessage({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        payload: {
          type: 'interactive',
          interactive: {
            type: 'list',
            header: { type: 'text', text: 'Select Service' },
            body: { text: language === 'TELUGU' ? '???? Revanta AI ??? ????? ????????' : 'How can Revanta AI help you?' },
            action: {
              button: 'Choose',
              sections: [
                {
                  title: 'Select Service',
                  rows: [
                    { id: 'service_automation', title: 'Improve Business' },
                    { id: 'service_software', title: 'Build Software' },
                    { id: 'service_ai', title: 'AI Agent' },
                    { id: 'service_web', title: 'Website / App' },
                    { id: 'service_crm', title: 'CRM System' },
                    { id: 'service_iot', title: 'IoT / 3D Experience' },
                    { id: 'service_team', title: 'Talk with Team' }
                  ]
                }
              ]
            }
          }
        },
        metadata: { source: 'consultant', language }
      });

      await scheduleConversationReminder({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        leadId: conversation.leadId,
        reminderType: 'DISCOVERY',
        scheduledFor: new Date(now.getTime() + REMINDER_DELAY_MINUTES * 60 * 1000),
        actorId: params.actorId
      });

      await transitionConversationState({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        actorId: params.actorId,
        toState: 'DISCOVERY',
        reason: 'service_selection_prompt_sent'
      });

      return exitFlow({ skipped: false, outcome: 'service_selection_prompted' });
    }

    await transitionConversationState({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      toState: 'REQUIREMENT_COLLECTION',
      reason: 'service_selected',
      patch: { selectedService: nextService }
    });

    const askIntro =
      language === 'TELUGU'
        ? '????????? ??????? ?????, ?????? ??????? ???????????????????????.\n\n1) ???? ? ???????? ?????????\n2) ????????? ?? ????? ????? ??????\n3) ???? ???????? ????? ??????'
        : 'Before we suggest a solution, we need a few details.\n\n1) What business do you run?\n2) What is the biggest challenge today?\n3) What outcome do you expect?';

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: askIntro,
      metadata: { source: 'consultant', autoReply: true, language }
    });

    await scheduleConversationReminder({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      leadId: conversation.leadId,
      reminderType: 'REQUIREMENT_COLLECTION',
      scheduledFor: new Date(now.getTime() + REMINDER_DELAY_MINUTES * 60 * 1000),
      actorId: params.actorId
    });

    return exitFlow({ skipped: false, outcome: 'requirement_collection_started' }, { selectedService: nextService });
  }

  if (flowStep === 'REQUIREMENT_COLLECTION') {
    let parsed: Record<string, unknown> = {};
    try {
      const brain = await runAIPrompt({
        organizationId: params.organizationId,
        userId: params.actorId || conversation.assignedToId || null,
        purpose: 'reply',
        prompt: JSON.stringify({
          language,
          selectedService,
          inbound: params.inboundBody,
          conversation: { flowStep, recentMessages }
        }),
        parseJson: true,
        system:
          'You are a business consultant for Revanta OS WhatsApp. Extract: businessType, currentProblems (array), expectedOutcome, featuresRequired (array), timeline, referenceRequest (boolean), pricingOrMeeting (boolean), complexRequest (boolean), confidence (0-1). Return JSON only.'
      });
      parsed = (brain.parsed || {}) as Record<string, unknown>;
    } catch {
      parsed = {};
    }

    const pricingOrMeeting =
      normalized.includes('price') ||
      normalized.includes('pricing') ||
      normalized.includes('meeting') ||
      normalized.includes('call') ||
      normalized.includes('quote');

    const confidence = typeof parsed.confidence === 'number' ? (parsed.confidence as number) : 0.3;
    const businessType = typeof parsed.businessType === 'string' ? parsed.businessType.trim() : '';
    const problemList = Array.isArray(parsed.currentProblems)
      ? (parsed.currentProblems as unknown[]).filter((value) => typeof value === 'string').map((value) => String(value).trim()).filter(Boolean)
      : [];
    const featureList = Array.isArray(parsed.featuresRequired)
      ? (parsed.featuresRequired as unknown[]).filter((value) => typeof value === 'string').map((value) => String(value).trim()).filter(Boolean)
      : [];
    const outcome = typeof parsed.expectedOutcome === 'string' ? parsed.expectedOutcome.trim() : '';
    const timeline = typeof parsed.timeline === 'string' ? parsed.timeline.trim() : '';
    const requirementsAreDetailed =
      params.inboundBody.trim().length >= 40 &&
      Boolean(selectedService || businessType) &&
      (problemList.length > 0 || featureList.length > 0 || Boolean(outcome));

    if (pricingOrMeeting || confidence < 0.25) {
      await transitionConversationState({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        actorId: params.actorId,
        toState: 'HUMAN',
        reason: 'pricing_or_low_confidence',
        aiState: 'HUMAN_ACTIVE',
        humanTakeoverAt: now,
        status: 'PENDING',
        patch: {
          handoffReason: 'pricing_or_low_confidence'
        }
      });

      await sendWhatsAppTextMessage({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        text: buildHumanHandoffMessage(language, calendlyBookingUrl),
        metadata: {
          source: 'consultant',
          autoReply: true,
          language,
          handoffReason: 'pricing_or_low_confidence',
          calendlyBookingUrl
        }
      });

      await writeConversationLog({
        organizationId: params.organizationId,
        actorId: params.actorId || null,
        eventType: "WHATSAPP_HUMAN_HANDOFF",
        message: `[HUMAN_HANDOFF] conversationId=${conversation.id}`,
        payload: {
          conversationId: conversation.id,
          handoffReason: 'pricing_or_low_confidence',
          confidence
        }
      });

      return exitFlow({ skipped: false, reason: 'Human takeover requested', outcome: 'human_handoff_notified' }, { confidence });
    }

    await prisma.executionLog.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.actorId || null,
        eventType: "WHATSAPP_REQUIREMENT_CAPTURED",
        level: "INFO",
        message: `[REQUIREMENT_CAPTURED] conversationId=${conversation.id} confidence=${confidence}`,
        payload: toJsonValue({
          conversationId: conversation.id,
          selectedService,
          businessType,
          currentProblems: problemList,
          expectedOutcome: outcome || null,
          featuresRequired: featureList,
          timeline: timeline || null,
          confidence
        })
      }
    });

    if (conversation.leadId || lead?.id) {
      await prisma.lead.update({
        where: { id: conversation.leadId || lead?.id || "" },
        data: {
          serviceType: selectedService || lead?.serviceType || undefined,
          category: businessType || lead?.category || undefined,
          lastActivityAt: now,
          enrichment: toJsonValue({
            ...toJsonObject(lead?.enrichment),
            requirementExtraction: {
              selectedService,
              businessType: businessType || null,
              currentProblems: problemList,
              expectedOutcome: outcome || null,
              featuresRequired: featureList,
              timeline: timeline || null,
              confidence
            }
          })
        }
      });
    }

    const qualification = await qualifyLeadWithBrain({
      organizationId: params.organizationId,
      userId: params.actorId || conversation.assignedToId || null,
      lead: {
        id: lead?.id || conversation.leadId || conversation.id,
        companyName: businessType || lead?.companyName || null,
        fullName: lead?.fullName || null,
        email: lead?.email || null,
        phone: lead?.phone || null,
        website: lead?.website || null,
        category: lead?.category || null,
        sourceLabel: lead?.sourceLabel || null,
        notes: lead?.notes || null,
        status: lead?.status || null,
        score: lead?.score || null,
        enrichment: lead?.enrichment || null,
        aiSummary: lead?.aiSummary || null
      },
      conversationContext: JSON.stringify({
        selectedService,
        businessType,
        currentProblems: problemList,
        expectedOutcome: outcome || null,
        featuresRequired: featureList,
        timeline: timeline || null
      })
    });
    const parsedQualification = (qualification.parsed || {}) as Record<string, unknown>;
    const nextScore = typeof parsedQualification.score === 'number' ? parsedQualification.score : lead?.score || null;

    if (conversation.leadId || lead?.id) {
      await prisma.lead.update({
        where: { id: conversation.leadId || lead?.id || "" },
        data: {
          score: nextScore,
          intent: typeof parsedQualification.intent === 'string' ? parsedQualification.intent : undefined,
          industry: typeof parsedQualification.industry === 'string' ? parsedQualification.industry : undefined,
          recommendedService:
            typeof parsedQualification.recommendedService === 'string'
              ? parsedQualification.recommendedService
              : selectedService || undefined,
          qualificationNotes:
            typeof parsedQualification.qualificationNotes === 'string'
              ? parsedQualification.qualificationNotes
              : undefined,
          nextBestAction:
            typeof parsedQualification.nextBestAction === 'string'
              ? parsedQualification.nextBestAction
              : undefined,
          aiQualifiedAt: now,
          status: typeof nextScore === 'number' && nextScore >= 70 && lead?.status === 'NEW' ? 'QUALIFIED' : undefined,
          enrichment: toJsonValue({
            ...toJsonObject(lead?.enrichment),
            requirementExtraction: {
              selectedService,
              businessType: businessType || null,
              currentProblems: problemList,
              expectedOutcome: outcome || null,
              featuresRequired: featureList,
              timeline: timeline || null,
              confidence
            },
            aiQualification: parsedQualification
          })
        }
      });
    }

    await writeConversationLog({
      organizationId: params.organizationId,
      actorId: params.actorId || null,
      eventType: "WHATSAPP_QUALIFIED",
      message: `[QUALIFIED] conversationId=${conversation.id}`,
      payload: {
        conversationId: conversation.id,
        score: nextScore,
        recommendedService:
          typeof parsedQualification.recommendedService === 'string'
            ? parsedQualification.recommendedService
            : selectedService || null
      }
    });

    if (requirementsAreDetailed) {
      const summaryParts = [
        businessType ? `Business: ${businessType}.` : null,
        problemList.length > 0 ? `Challenges: ${problemList.join(", ")}.` : null,
        outcome ? `Goal: ${outcome}.` : null,
        featureList.length > 0 ? `Suggested scope: ${featureList.join(", ")}.` : null,
        timeline ? `Timeline noted: ${timeline}.` : null
      ].filter(Boolean);
      const recommendedService =
        typeof parsedQualification.recommendedService === 'string'
          ? parsedQualification.recommendedService
          : selectedService || 'a custom Revanta AI solution';
      const summaryText =
        language === 'TELUGU'
          ? `మీ వివరాలకు ధన్యవాదాలు.\n\n${summaryParts.join("\n")}\n\nమా సిఫార్సు: ${recommendedService}.`
          : `Thanks for sharing the details.\n\n${summaryParts.join("\n")}\n\nRecommended next step: ${recommendedService}.`;

      await transitionConversationState({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        actorId: params.actorId,
        toState: calendlyBookingUrl ? 'BOOK_DISCOVERY_CALL' : 'QUALIFICATION_COMPLETE',
        reason: 'requirements_qualified',
        status: calendlyBookingUrl ? 'OPEN' : 'PENDING',
        patch: {
          calendlyBookingUrl,
          requirementExtractionComplete: true,
          flowOutcome: calendlyBookingUrl ? 'awaiting_booking' : 'awaiting_human_followup'
        }
      });

      await sendWhatsAppTextMessage({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        text: summaryText,
        metadata: {
          source: 'consultant',
          autoReply: true,
          language,
          selectedService,
          businessType,
          confidence
        }
      });

      await sendWhatsAppTextMessage({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        text: calendlyBookingUrl
          ? buildCalendlyDiscoveryCallMessage(calendlyBookingUrl) ||
            buildHumanHandoffMessage(language, calendlyBookingUrl)
          : buildHumanHandoffMessage(language, null),
        metadata: {
          source: 'consultant',
          autoReply: true,
          language,
          calendlyBookingUrl
        }
      });

      if (calendlyBookingUrl) {
        await writeConversationLog({
          organizationId: params.organizationId,
          actorId: params.actorId || null,
          eventType: "WHATSAPP_CALENDLY_OFFERED",
          message: `[CALENDLY_OFFERED] conversationId=${conversation.id}`,
          payload: {
            conversationId: conversation.id,
            calendlyBookingUrl
          }
        });
        await scheduleConversationReminder({
          organizationId: params.organizationId,
          conversationId: conversation.id,
          leadId: conversation.leadId,
          reminderType: 'BOOK_DISCOVERY_CALL',
          scheduledFor: new Date(now.getTime() + REMINDER_DELAY_MINUTES * 60 * 1000),
          actorId: params.actorId
        });
      } else {
        await writeConversationLog({
          organizationId: params.organizationId,
          actorId: params.actorId || null,
          eventType: "WHATSAPP_HUMAN_HANDOFF",
          message: `[HUMAN_HANDOFF] conversationId=${conversation.id}`,
          payload: {
            conversationId: conversation.id,
            handoffReason: 'qualified_no_calendly_config'
          }
        });
      }

      return exitFlow({
        skipped: false,
        outcome: calendlyBookingUrl ? 'qualified_and_calendly_offered' : 'qualified_and_human_followup_notified'
      });
    }

    const problems = problemList.length > 0 ? problemList.join(', ') : null;
    const normalizedOutcome = outcome || null;

    const consultantText = language === 'TELUGU'
      ? '?? ????????? ?????, ?? ?????? ???????: ' + (problems || '(????????? ??????? ????)') + '.\n???? ????????? ?????: ' + (normalizedOutcome || '(????????? ??????? ????)') + '.\n\n??????? ???? ????????? ???????/??????????? ????'
      : 'Based on what you shared, your current pain points: ' + (problems || '(not fully specified)') + '.\nExpected outcome: ' + (normalizedOutcome || '(not fully specified)') + '.\n\nWhat features do you need?';

    await transitionConversationState({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      toState: 'CONSULTATION',
      reason: 'need_more_requirement_detail'
    });

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: consultantText,
      metadata: { source: 'consultant', autoReply: true, language }
    });

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: language === 'TELUGU'
          ? '???? ??????? reference app, website, or example ????? ????? link ???? screenshot ??????.'
          : 'Do you have any reference app, website, or example you like? You can share link or screenshot.',
      metadata: { source: 'consultant', autoReply: true, language }
    });

    await scheduleConversationReminder({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      leadId: conversation.leadId,
      reminderType: 'CONSULTATION',
      scheduledFor: new Date(now.getTime() + REMINDER_DELAY_MINUTES * 60 * 1000),
      actorId: params.actorId
    });

    return exitFlow({ skipped: false, outcome: 'consultation_follow_up_requested' });
  }

  if (flowStep === 'CONSULTATION') {
    await transitionConversationState({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      toState: calendlyBookingUrl ? 'BOOK_DISCOVERY_CALL' : 'QUALIFICATION_COMPLETE',
      reason: 'consultation_details_received',
      status: calendlyBookingUrl ? 'OPEN' : 'PENDING',
      patch: {
        flowOutcome: calendlyBookingUrl ? 'awaiting_booking' : 'awaiting_human_followup'
      }
    });

    const follow = language === 'TELUGU'
      ? 'ధన్యవాదాలు. మీ అవసరాలు నమోదు చేశాము. తదుపరి దశగా మా టీమ్ మీతో చర్చించేందుకు సిద్ధంగా ఉంది.'
      : 'Thanks. We have captured your requirements and prepared the next step.';

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: follow,
      metadata: { source: 'consultant', autoReply: true, language }
    });

    if (calendlyBookingUrl) {
      await sendWhatsAppTextMessage({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        text: buildCalendlyDiscoveryCallMessage(calendlyBookingUrl)!,
        metadata: { source: 'consultant', autoReply: true, language, calendlyBookingUrl }
      });

      await writeConversationLog({
        organizationId: params.organizationId,
        actorId: params.actorId || null,
        eventType: "WHATSAPP_CALENDLY_OFFERED",
        message: `[CALENDLY_OFFERED] conversationId=${conversation.id}`,
        payload: {
          conversationId: conversation.id,
          calendlyBookingUrl
        }
      });

      await scheduleConversationReminder({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        leadId: conversation.leadId,
        reminderType: 'BOOK_DISCOVERY_CALL',
        scheduledFor: new Date(now.getTime() + REMINDER_DELAY_MINUTES * 60 * 1000),
        actorId: params.actorId
      });
    } else {
      await sendWhatsAppTextMessage({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        text: buildHumanHandoffMessage(language, null),
        metadata: { source: 'consultant', autoReply: true, language, handoffReason: 'consultation_completed' }
      });

      await writeConversationLog({
        organizationId: params.organizationId,
        actorId: params.actorId || null,
        eventType: "WHATSAPP_HUMAN_HANDOFF",
        message: `[HUMAN_HANDOFF] conversationId=${conversation.id}`,
        payload: {
          conversationId: conversation.id,
          handoffReason: 'consultation_completed'
        }
      });
    }

    return exitFlow({
      skipped: false,
      outcome: calendlyBookingUrl ? 'consultation_completed_with_calendly' : 'consultation_completed_with_human_followup'
    });
  }

  if (flowStep === 'BOOK_DISCOVERY_CALL') {
    const bookingFollowUp =
      language === 'TELUGU'
        ? calendlyBookingUrl
          ? `ధన్యవాదాలు. మీరు సిద్ధంగా ఉన్నప్పుడు ఈ లింక్‌లో కాల్ బుక్ చేయండి:\n${calendlyBookingUrl}\n\nమీరు ఇప్పటికే బుక్ చేసి ఉంటే ఇక్కడే తెలియజేయండి.`
          : 'ధన్యవాదాలు. మా టీమ్ మీతో తదుపరి దశ కోసం సంప్రదిస్తుంది.'
        : calendlyBookingUrl
          ? `Thanks. When you are ready, book your discovery call here:\n${calendlyBookingUrl}\n\nIf you have already booked, just reply here and our team will continue from there.`
          : 'Thanks. Our team will continue the next step with you shortly.';

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: bookingFollowUp,
      metadata: {
        source: 'consultant',
        autoReply: true,
        language,
        calendlyBookingUrl
      }
    });

    if (calendlyBookingUrl) {
      await writeConversationLog({
        organizationId: params.organizationId,
        actorId: params.actorId || null,
        eventType: "WHATSAPP_CALENDLY_OFFERED",
        message: `[CALENDLY_OFFERED] conversationId=${conversation.id}`,
        payload: {
          conversationId: conversation.id,
          calendlyBookingUrl,
          flowStep: 'BOOK_DISCOVERY_CALL'
        }
      });

      await scheduleConversationReminder({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        leadId: conversation.leadId,
        reminderType: 'BOOK_DISCOVERY_CALL',
        scheduledFor: new Date(now.getTime() + REMINDER_DELAY_MINUTES * 60 * 1000),
        actorId: params.actorId
      });
    }

    return exitFlow({
      skipped: false,
      outcome: calendlyBookingUrl ? 'booking_followup_reinforced' : 'awaiting_human_followup'
    });
  }

  if (flowStep === 'QUALIFICATION_COMPLETE') {
    await transitionConversationState({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      toState: 'HUMAN',
      reason: 'post_qualification_follow_up',
      aiState: 'HUMAN_ACTIVE',
      humanTakeoverAt: now,
      status: 'PENDING',
      patch: {
        handoffReason: 'post_qualification_follow_up',
        flowOutcome: 'awaiting_human_followup'
      }
    });

    await sendWhatsAppTextMessage({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      text: buildHumanHandoffMessage(language, null),
      metadata: {
        source: 'consultant',
        autoReply: true,
        language,
        handoffReason: 'post_qualification_follow_up'
      }
    });

    await writeConversationLog({
      organizationId: params.organizationId,
      actorId: params.actorId || null,
      eventType: "WHATSAPP_HUMAN_HANDOFF",
      message: `[HUMAN_HANDOFF] conversationId=${conversation.id}`,
      payload: {
        conversationId: conversation.id,
        handoffReason: 'post_qualification_follow_up'
      }
    });

    return exitFlow({ skipped: false, outcome: 'post_qualification_handoff_notified' });
  }

  await transitionConversationState({
    organizationId: params.organizationId,
    conversationId: conversation.id,
    actorId: params.actorId,
    toState: 'DISCOVERY',
    reason: 'fallback_to_discovery'
  });

  return handleConsultantConversation({
    organizationId: params.organizationId,
    conversationId: params.conversationId,
    inboundBody: params.inboundBody,
    actorId: params.actorId
  });
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

  await cancelPendingConversationReminders({
    organizationId: params.organizationId,
    conversationId: conversation.id,
    actorId: assignedToId
  });

  let autoReply: Awaited<ReturnType<typeof sendAutomaticWhatsAppReply>>;
  try {
    autoReply = await sendAutomaticWhatsAppReply({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      inboundBody: params.body,
      actorId: assignedToId
    });
  } catch (error: any) {
    await logWhatsAppAutomationError({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      leadId: lead.id,
      actorId: assignedToId,
      message: "Automatic WhatsApp reply failed.",
      details: {
        inboundBody: params.body,
        error: error?.message || String(error)
      }
    });
    throw error;
  }

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
