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

// Reminder ladder (minutes): 1=5, 2=30, 3=24h
const REMINDER_DELAY_MINUTES = 5;
const REMINDER_DELAY_MINUTES_2 = 30;
const REMINDER_DELAY_MINUTES_3 = 24 * 60;

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

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${integration.phoneNumberId}/messages`,
    {
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
    }
  );

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("[WA_META_ERROR]", JSON.stringify(json, null, 2));
    await prisma.message.update({
      where: { id: stored.id },
      data: {
        status: "failed",
        retryCount: stored.retryCount + 1,
        lastFailedAt: new Date(),
        nextRetryAt: new Date(
          Date.now() + getRetryDelayMinutes(stored.retryCount) * 60 * 1000
        ),
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

  const messageSource =
    typeof params.metadata?.source === "string" ? params.metadata.source : "manual";

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

function getWhatsAppMediaType(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}

export async function sendWhatsAppMediaMessage(params: {
  organizationId: string;
  conversationId: string;
  file: File;
  caption?: string | null;
  mediaUrl?: string | null;
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

  const mimeType = params.file.type || "application/octet-stream";
  const mediaType = getWhatsAppMediaType(mimeType);
  const uploadForm = new FormData();
  uploadForm.append("messaging_product", "whatsapp");
  uploadForm.append("type", mimeType);
  uploadForm.append("file", params.file, params.file.name);

  const uploadResponse = await fetch(`https://graph.facebook.com/v19.0/${integration.phoneNumberId}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: uploadForm
  });
  const uploadJson = await uploadResponse.json().catch(() => null);
  if (!uploadResponse.ok || !uploadJson?.id) {
    throw new Error(uploadJson?.error?.message || "WhatsApp media upload failed.");
  }

  const body =
    params.caption?.trim() ||
    (mediaType === "image" ? "Image" : mediaType === "video" ? "Video" : mediaType === "audio" ? "Audio" : params.file.name);
  const stored = await storeOutgoingWhatsAppMessage({
    organizationId: params.organizationId,
    leadId: conversation.leadId,
    conversationId: conversation.id,
    body,
    metadata: {
      ...(params.metadata || {}),
      source: "HUMAN",
      mediaId: uploadJson.id,
      mediaUrl: params.mediaUrl || null,
      mediaType,
      mimeType,
      fileName: params.file.name
    }
  });

  await prisma.attachment.create({
    data: {
      organizationId: params.organizationId,
      conversationId: conversation.id,
      messageId: stored.id,
      leadId: conversation.leadId,
      fileName: params.file.name,
      mimeType,
      url: params.mediaUrl || null,
      sizeBytes: params.file.size,
      metadata: toJsonValue({
        source: "HUMAN",
        mediaId: uploadJson.id,
        mediaType
      })
    }
  });

  const mediaPayload: Record<string, unknown> = {
    id: uploadJson.id
  };
  if (mediaType === "document") {
    mediaPayload.filename = params.file.name;
    if (params.caption?.trim()) mediaPayload.caption = params.caption.trim();
  }
  if ((mediaType === "image" || mediaType === "video") && params.caption?.trim()) {
    mediaPayload.caption = params.caption.trim();
  }

  const response = await fetch(`https://graph.facebook.com/v19.0/${integration.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: mediaType,
      [mediaType]: mediaPayload
    })
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    await prisma.message.update({
      where: { id: stored.id },
      data: {
        status: "failed",
        retryCount: stored.retryCount + 1,
        lastFailedAt: new Date(),
        failureReason: json?.error?.message || "WhatsApp media send failed.",
        metadata: toJsonValue({
          ...(stored.metadata ? toJsonObject(stored.metadata) : {}),
          providerError: json || null
        })
      }
    });
    throw new Error(json?.error?.message || "WhatsApp media send failed.");
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
      source: "HUMAN",
      mediaType
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
    body:
      typeof payload?.interactive?.body?.text === "string"
        ? payload.interactive.body.text
        : "",
    metadata: params.metadata
  });

  console.log("[WA_OUTBOUND_PAYLOAD]", JSON.stringify(payload, null, 2));

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${integration.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("[WA_META_ERROR]", JSON.stringify(json, null, 2));
    await prisma.message.update({
      where: { id: stored.id },
      data: {
        status: "failed",
        retryCount: stored.retryCount + 1,
        lastFailedAt: new Date(),
        nextRetryAt: new Date(
          Date.now() + getRetryDelayMinutes(stored.retryCount) * 60 * 1000
        ),
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

  const messageSource =
    typeof params.metadata?.source === "string" ? params.metadata.source : "manual";

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

type ConversationFlowStep =
  | "SERVICE_SELECTION"
  | "DISCOVERY"
  | "REQUIREMENT_COLLECTION"
  | "CONSULTATION"
  | "QUALIFICATION_COMPLETE"
  | "BOOK_DISCOVERY_CALL"
  | "HUMAN_HANDOFF";

type ConversationEngineMetadata = {
  flowStep: ConversationFlowStep;
  selectedService: string | null;
  waitingForUserReply: boolean;
  nextExpectedState: ConversationFlowStep | null;
  lastQuestionAsked: string | null;
  featuresAnswer: string | null;
  referenceAnswer: string | null;
  lastBotInteraction: string;
};

const CONVERSATION_FLOW_STATES: ConversationFlowStep[] = [
  "SERVICE_SELECTION",
  "DISCOVERY",
  "REQUIREMENT_COLLECTION",
  "CONSULTATION",
  "QUALIFICATION_COMPLETE",
  "BOOK_DISCOVERY_CALL",
  "HUMAN_HANDOFF"
];

const SERVICE_OPTIONS = [
  { id: "service_improve_business", title: "Improve Business" },
  { id: "service_build_software", title: "Build Software" },
  { id: "service_ai_agent", title: "AI Agent" },
  { id: "service_website_app", title: "Website / App" },
  { id: "service_crm_system", title: "CRM System" },
  { id: "service_iot_3d", title: "IoT / 3D Experience" },
  { id: "service_talk_team", title: "Talk with Team" }
];

function normalizeConversationMetadata(metadata: unknown): ConversationEngineMetadata {
  const value = metadata ? toJsonObject(metadata) : {};
  const flowStep =
    typeof value.flowStep === "string" && CONVERSATION_FLOW_STATES.includes(value.flowStep as ConversationFlowStep)
      ? (value.flowStep as ConversationFlowStep)
      : "SERVICE_SELECTION";

  return {
    flowStep,
    selectedService: typeof value.selectedService === "string" ? value.selectedService : null,
    waitingForUserReply: value.waitingForUserReply === true,
    nextExpectedState:
      typeof value.nextExpectedState === "string" &&
      CONVERSATION_FLOW_STATES.includes(value.nextExpectedState as ConversationFlowStep)
        ? (value.nextExpectedState as ConversationFlowStep)
        : null,
    lastQuestionAsked: typeof value.lastQuestionAsked === "string" ? value.lastQuestionAsked : null,
    featuresAnswer: typeof value.featuresAnswer === "string" ? value.featuresAnswer : null,
    referenceAnswer: typeof value.referenceAnswer === "string" ? value.referenceAnswer : null,
    lastBotInteraction: typeof value.lastBotInteraction === "string" ? value.lastBotInteraction : new Date().toISOString()
  };
}

async function persistConversationEngineMetadata(params: {
  organizationId: string;
  conversationId: string;
  metadata: ConversationEngineMetadata;
  actorId?: string | null;
  reason: string;
}) {
  await transitionConversationState({
    organizationId: params.organizationId,
    conversationId: params.conversationId,
    actorId: params.actorId,
    toState: params.metadata.flowStep,
    reason: params.reason,
    patch: {
      selectedService: params.metadata.selectedService,
      waitingForUserReply: params.metadata.waitingForUserReply,
      nextExpectedState: params.metadata.nextExpectedState,
      lastQuestionAsked: params.metadata.lastQuestionAsked,
      featuresAnswer: params.metadata.featuresAnswer,
      referenceAnswer: params.metadata.referenceAnswer,
      lastBotInteraction: params.metadata.lastBotInteraction
    }
  });
}

async function logConversationFlow(params: {
  organizationId: string;
  actorId?: string | null;
  tag: string;
  conversationId: string;
  flowStep: string;
  payload?: Record<string, unknown>;
}) {
  await writeConversationLog({
    organizationId: params.organizationId,
    actorId: params.actorId || null,
    eventType: "WHATSAPP_CONVERSATION_ENGINE",
    message: `[${params.tag}] conversationId=${params.conversationId} flowStep=${params.flowStep}`,
    payload: {
      conversationId: params.conversationId,
      flowStep: params.flowStep,
      ...(params.payload || {})
    }
  });
}

function getGreeting(name?: string | null) {
  const hour = new Date().getHours();
  const label = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  return `${label} ${name?.trim() || "there"}`;
}

function normalizeSelectedService(input: string) {
  const normalized = input.trim().toLowerCase();
  const matched = SERVICE_OPTIONS.find(
    (option) => option.id.toLowerCase() === normalized || option.title.toLowerCase() === normalized
  );
  if (matched) return matched.title;
  if (normalized.includes("build") || normalized.includes("software")) return "Build Software";
  if (normalized.includes("crm")) return "CRM System";
  if (normalized.includes("agent") || normalized.includes("ai")) return "AI Agent";
  if (normalized.includes("website") || normalized.includes("app")) return "Website / App";
  if (normalized.includes("iot") || normalized.includes("3d")) return "IoT / 3D Experience";
  if (normalized.includes("team") || normalized.includes("talk") || normalized.includes("human")) return "Talk with Team";
  if (normalized.includes("business") || normalized.includes("improve")) return "Improve Business";
  return input.trim() || "Build Software";
}

function buildDiscoveryQuestion(service: string) {
  if (service === "CRM System") {
    return "Before we suggest a CRM solution, we need a few details.\n\n1. What sales or customer process do you want to manage?\n2. What tools are you using today?\n3. What outcome do you expect from the CRM?";
  }
  if (service === "AI Agent") {
    return "Before we suggest an AI agent, we need a few details.\n\n1. What task should the AI agent handle?\n2. Where does the work happen today?\n3. What result would make this useful for your team?";
  }
  if (service === "Website / App") {
    return "Before we suggest a website or app solution, we need a few details.\n\n1. What type of website or app do you need?\n2. Who will use it?\n3. What outcome do you expect?";
  }
  if (service === "IoT / 3D Experience") {
    return "Before we suggest an IoT or 3D experience, we need a few details.\n\n1. What device, product, or experience are you building?\n2. What should users be able to do?\n3. What outcome do you expect?";
  }
  if (service === "Improve Business") {
    return "Before we suggest a business improvement plan, we need a few details.\n\n1. What business do you run?\n2. What process is slow, manual, or difficult today?\n3. What outcome do you expect?";
  }
  return "Before we suggest a solution, we need a few details.\n\n1. What business do you run?\n2. What is the biggest challenge today?\n3. What outcome do you expect?";
}

async function sendEngineReply(params: {
  organizationId: string;
  conversationId: string;
  text: string;
  flowStep: string;
  actorId?: string | null;
}) {
  await logConversationFlow({
    organizationId: params.organizationId,
    actorId: params.actorId,
    tag: "WA_SEND_MESSAGE",
    conversationId: params.conversationId,
    flowStep: params.flowStep,
    payload: { text: params.text }
  });

  return sendWhatsAppTextMessage({
    organizationId: params.organizationId,
    conversationId: params.conversationId,
    text: params.text,
    metadata: {
      source: "conversation_engine",
      autoReply: true,
      flowStep: params.flowStep
    }
  });
}

async function sendServiceSelectionList(params: {
  organizationId: string;
  conversationId: string;
  text: string;
  flowStep: string;
  actorId?: string | null;
}) {
  await logConversationFlow({
    organizationId: params.organizationId,
    actorId: params.actorId,
    tag: "WA_SEND_MESSAGE",
    conversationId: params.conversationId,
    flowStep: params.flowStep,
    payload: { text: params.text, messageType: "interactive_list" }
  });

  return sendWhatsAppInteractiveMessage({
    organizationId: params.organizationId,
    conversationId: params.conversationId,
    payload: {
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: "Revanta AI" },
        body: { text: params.text },
        action: {
          button: "Choose Service",
          sections: [
            {
              title: "Services",
              rows: SERVICE_OPTIONS.map((option) => ({
                id: option.id,
                title: option.title
              }))
            }
          ]
        }
      }
    },
    metadata: {
      source: "conversation_engine",
      autoReply: true,
      flowStep: params.flowStep
    }
  });
}

async function finishConversationTurn(params: {
  organizationId: string;
  conversationId: string;
  actorId?: string | null;
  metadata: ConversationEngineMetadata;
  text: string;
  useServiceList?: boolean;
}) {
  await persistConversationEngineMetadata({
    organizationId: params.organizationId,
    conversationId: params.conversationId,
    actorId: params.actorId,
    metadata: params.metadata,
    reason: params.metadata.waitingForUserReply ? "waiting_for_user_reply" : "flow_step_completed"
  });

  if (params.metadata.waitingForUserReply) {
    await logConversationFlow({
      organizationId: params.organizationId,
      actorId: params.actorId,
      tag: "WAITING_FOR_USER_REPLY",
      conversationId: params.conversationId,
      flowStep: params.metadata.flowStep,
      payload: {
        nextExpectedState: params.metadata.nextExpectedState,
        lastQuestionAsked: params.metadata.lastQuestionAsked
      }
    });
  }

  if (params.useServiceList) {
    await sendServiceSelectionList({
      organizationId: params.organizationId,
      actorId: params.actorId,
      conversationId: params.conversationId,
      flowStep: params.metadata.flowStep,
      text: params.text
    });
  } else {
    await sendEngineReply({
      organizationId: params.organizationId,
      actorId: params.actorId,
      conversationId: params.conversationId,
      flowStep: params.metadata.flowStep,
      text: params.text
    });
  }

  await logConversationFlow({
    organizationId: params.organizationId,
    actorId: params.actorId,
    tag: "FLOW_EXIT",
    conversationId: params.conversationId,
    flowStep: params.metadata.flowStep,
    payload: {
      waitingForUserReply: params.metadata.waitingForUserReply,
      nextExpectedState: params.metadata.nextExpectedState
    }
  });

  return { skipped: false, flowStep: params.metadata.flowStep };
}

async function runReplacementConversationEngine(params: {
  organizationId: string;
  conversation: any;
  lead: any;
  inboundBody: string;
  actorId?: string | null;
}) {
  const _tEngineStart = Date.now();
  console.log("[ENGINE_START]");
  const conversation = await prisma.conversation.findFirst({
    where: { id: params.conversation.id, organizationId: params.organizationId },
    include: { lead: true }
  });

  if (!conversation) {
    return { skipped: true, reason: "Conversation not found" };
  }

  const initialMetadata = normalizeConversationMetadata(conversation.metadata);

  await logConversationFlow({
    organizationId: params.organizationId,
    actorId: params.actorId,
    tag: "FLOW_ENTER",
    conversationId: conversation.id,
    flowStep: initialMetadata.flowStep,
    payload: {
      waitingForUserReply: initialMetadata.waitingForUserReply,
      nextExpectedState: initialMetadata.nextExpectedState
    }
  });

  if (conversation.aiState === "HUMAN_ACTIVE") {
    await logConversationFlow({
      organizationId: params.organizationId,
      actorId: params.actorId,
      tag: "FLOW_EXIT",
      conversationId: conversation.id,
      flowStep: initialMetadata.flowStep,
      payload: { skipped: true, reason: "HUMAN_ACTIVE" }
    });
    return { skipped: true, reason: "HUMAN_ACTIVE" };
  }

  const now = new Date().toISOString();
  const metadata = { ...initialMetadata };
  const inboundText = params.inboundBody.trim();

  if (metadata.waitingForUserReply && metadata.nextExpectedState) {
    if (metadata.flowStep === "SERVICE_SELECTION" && metadata.nextExpectedState === "DISCOVERY") {
      metadata.selectedService = normalizeSelectedService(inboundText);
    }
    if (metadata.flowStep === "REQUIREMENT_COLLECTION" && metadata.nextExpectedState === "CONSULTATION") {
      metadata.featuresAnswer = inboundText;
    }
    if (metadata.flowStep === "CONSULTATION" && metadata.nextExpectedState === "QUALIFICATION_COMPLETE") {
      metadata.referenceAnswer = inboundText;
    }

    metadata.flowStep = metadata.nextExpectedState;
    metadata.waitingForUserReply = false;
    metadata.nextExpectedState = null;
    metadata.lastBotInteraction = now;

    await logConversationFlow({
      organizationId: params.organizationId,
      actorId: params.actorId,
      tag: "USER_REPLY_RECEIVED",
      conversationId: conversation.id,
      flowStep: metadata.flowStep,
      payload: {
        lastQuestionAsked: initialMetadata.lastQuestionAsked,
        reply: inboundText
      }
    });

    await logConversationFlow({
      organizationId: params.organizationId,
      actorId: params.actorId,
      tag: "STATE_ADVANCE",
      conversationId: conversation.id,
      flowStep: metadata.flowStep,
      payload: {
        fromState: initialMetadata.flowStep,
        toState: metadata.flowStep
      }
    });

    await persistConversationEngineMetadata({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      metadata,
      reason: "user_reply_received"
    });
  }

  if (metadata.flowStep === "SERVICE_SELECTION") {
    metadata.waitingForUserReply = true;
    metadata.nextExpectedState = "DISCOVERY";
    metadata.lastQuestionAsked = "Please choose your preferred service.";
    metadata.lastBotInteraction = now;
    return finishConversationTurn({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      metadata,
      text: `${getGreeting(params.lead.fullName || params.lead.companyName || null)}\n\nWelcome to Revanta AI.\n\nPlease choose your preferred service.`,
      useServiceList: true
    });
  }

  if (metadata.flowStep === "DISCOVERY") {
    if (metadata.selectedService === "Talk with Team") {
      metadata.flowStep = "HUMAN_HANDOFF";
      metadata.waitingForUserReply = false;
      metadata.nextExpectedState = null;
      metadata.lastQuestionAsked = null;
      metadata.lastBotInteraction = now;

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          aiState: "HUMAN_ACTIVE",
          humanTakeoverAt: new Date(),
          status: "PENDING"
        }
      });

      return finishConversationTurn({
        organizationId: params.organizationId,
        conversationId: conversation.id,
        actorId: params.actorId,
        metadata,
        text: "Thank you. A team member will contact you shortly."
      });
    }

    metadata.waitingForUserReply = true;
    metadata.nextExpectedState = "REQUIREMENT_COLLECTION";
    metadata.lastQuestionAsked = buildDiscoveryQuestion(metadata.selectedService || "Build Software");
    metadata.lastBotInteraction = now;
    return finishConversationTurn({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      metadata,
      text: metadata.lastQuestionAsked
    });
  }

  if (metadata.flowStep === "REQUIREMENT_COLLECTION") {
    metadata.waitingForUserReply = true;
    metadata.nextExpectedState = "CONSULTATION";
    metadata.lastQuestionAsked = "What features do you need in the system?";
    metadata.lastBotInteraction = now;
    return finishConversationTurn({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      metadata,
      text: metadata.lastQuestionAsked
    });
  }

  if (metadata.flowStep === "CONSULTATION") {
    metadata.waitingForUserReply = true;
    metadata.nextExpectedState = "QUALIFICATION_COMPLETE";
    metadata.lastQuestionAsked =
      "Do you have any reference website, application, CRM, or example system you would like us to follow?\n\nYou may share a link, screenshot, or name.";
    metadata.lastBotInteraction = now;
    return finishConversationTurn({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      metadata,
      text: metadata.lastQuestionAsked
    });
  }

  if (metadata.flowStep === "QUALIFICATION_COMPLETE") {
    const qualification = await qualifyLeadWithBrain({
      organizationId: params.organizationId,
      userId: params.actorId || null,
      lead: {
        id: params.lead.id,
        companyName: params.lead.companyName,
        fullName: params.lead.fullName,
        email: params.lead.email,
        phone: params.lead.phone,
        website: params.lead.website,
        category: params.lead.category,
        sourceLabel: params.lead.sourceLabel,
        notes: params.lead.notes,
        status: params.lead.status,
        score: params.lead.score,
        enrichment: params.lead.enrichment,
        aiSummary: params.lead.aiSummary
      },
      conversationContext: JSON.stringify({
        selectedService: metadata.selectedService,
        featuresAnswer: metadata.featuresAnswer,
        referenceAnswer: metadata.referenceAnswer
      })
    });
    const parsedQualification = qualification.parsed || {};
    const score = typeof parsedQualification.score === "number" ? parsedQualification.score : null;

    await prisma.lead.update({
      where: { id: params.lead.id },
      data: {
        score: score ?? params.lead.score,
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
          ...toJsonObject(params.lead.enrichment),
          conversationEngine: {
            selectedService: metadata.selectedService,
            featuresAnswer: metadata.featuresAnswer,
            referenceAnswer: metadata.referenceAnswer,
            qualification: parsedQualification
          }
        })
      }
    });

    metadata.waitingForUserReply = true;
    metadata.nextExpectedState = "BOOK_DISCOVERY_CALL";
    metadata.lastQuestionAsked = "Would you like to book a discovery call?";
    metadata.lastBotInteraction = now;
    return finishConversationTurn({
      organizationId: params.organizationId,
      conversationId: conversation.id,
      actorId: params.actorId,
      metadata,
      text:
        `Thank you for sharing your requirements.\n\nFeatures / needs: ${metadata.featuresAnswer || "Not specified"}\nReferences: ${metadata.referenceAnswer || "Not specified"}\n\nRecommended next step: ${
          typeof parsedQualification.recommendedService === "string"
            ? parsedQualification.recommendedService
            : "a short discovery call with our team"
        }.\n\nThe next step is a 30-minute discovery call where we can understand your goals and suggest the best solution.\n\nWould you like to book a discovery call?`
    });
  }

  const bookingUrl = getCalendlyBookingUrl();
  metadata.waitingForUserReply = false;
  metadata.nextExpectedState = null;
  metadata.lastQuestionAsked = null;
  metadata.lastBotInteraction = now;
  console.log("[ENGINE_END]");
  console.log("[TIMER_END]", { engineMs: Date.now() - _tEngineStart });
  return finishConversationTurn({
    organizationId: params.organizationId,
    conversationId: conversation.id,
    actorId: params.actorId,
    metadata,
    text: bookingUrl ? `Book your slot here:\n\n${bookingUrl}` : "A team member will contact you shortly to schedule a call."
  });
}

export async function processIncomingWhatsAppMessage(params: {
  organizationId: string;
  from: string;
  body: string;
  messageId?: string;
  name?: string;
  phoneNumberId?: string | null;
  waId?: string | null;
  media?: {
    mediaId?: string | null;
    mediaUrl?: string | null;
    mediaType?: string | null;
    mimeType?: string | null;
    fileName?: string | null;
  } | null;
}) {
  // Minimal stub to restore compilation if the file was previously corrupted.
  // Conversation flow logic should be restored after compilation gating is fixed.
  const phone = normalizePhone(params.from);
  const integration = await prisma.whatsAppIntegration.findUnique({
    where: { organizationId: params.organizationId },
    include: { defaultAssignee: true }
  });
  const { lead } = await findOrCreateLead({
    organizationId: params.organizationId,
    phone,
    name: params.name || null
  });

  const threadId = `${params.phoneNumberId || integration?.phoneNumberId || "whatsapp"}:${params.waId || phone}`;
  const conversation = await findOrCreateConversation({
    organizationId: params.organizationId,
    leadId: lead.id,
    companyId: (lead as any).companyId || null,
    contactId: null,
    subject: (lead as any).companyName || (lead as any).fullName || params.name || phone,
    phoneNumberId: params.phoneNumberId || integration?.phoneNumberId || null,
    externalId: phone,
    threadId,
    assignedToId: (lead as any).ownerId || integration?.defaultAssigneeId || null
  });

  const inboundMessage = await prisma.message.create({
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
        phoneNumberId: params.phoneNumberId || integration?.phoneNumberId || null,
        mediaId: params.media?.mediaId || null,
        mediaUrl: params.media?.mediaUrl || null,
        mediaType: params.media?.mediaType || null,
        mimeType: params.media?.mimeType || null,
        fileName: params.media?.fileName || null
      })
    }
  });

  if (params.media?.mediaId || params.media?.mediaUrl) {
    await prisma.attachment.create({
      data: {
        organizationId: params.organizationId,
        conversationId: conversation.id,
        messageId: inboundMessage.id,
        leadId: lead.id,
        fileName: params.media.fileName || `${params.media.mediaType || "media"}-${params.messageId || inboundMessage.id}`,
        mimeType: params.media.mimeType || null,
        url: params.media.mediaUrl || null,
        metadata: toJsonValue({
          source: "CUSTOMER",
          mediaId: params.media.mediaId || null,
          mediaType: params.media.mediaType || null
        })
      }
    });
  }

  const _tProcessStart = Date.now();
  console.log("[TIMER_START] processIncomingWhatsAppMessage", {
    conversationId: conversation.id,
    flowStep: conversation.metadata?.flowStep,
    aiState: conversation.aiState
  });

  console.log("[BEFORE_ENGINE]", {
    conversationId: conversation.id,
    flowStep: conversation.metadata?.flowStep,
    aiState: conversation.aiState
  });

  await runReplacementConversationEngine({
    organizationId: params.organizationId,
    conversation,
    lead,
    inboundBody: params.body,
    actorId: (lead as any).ownerId || integration?.defaultAssigneeId || null
  });

  console.log("[AFTER_ENGINE]", {
    conversationId: conversation.id
  });

  console.log("[BEFORE_RETURN]", {
    conversationId: conversation.id
  });

  return { lead, conversation };
}

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

  if (!message) return null;

  const timestamp = params.timestamp || new Date();
  const data: any = { status: params.status };

  if (params.status === "sent") data.sentAt = (message as any).sentAt || timestamp;
  if (params.status === "delivered") data.deliveredAt = timestamp;
  if (params.status === "read") data.readAt = timestamp;
  if (params.status === "failed") {
    data.retryCount = (message as any).retryCount + 1;
    data.nextRetryAt = new Date(timestamp.getTime() + getRetryDelayMinutes((message as any).retryCount) * 60 * 1000);
    data.lastFailedAt = timestamp;
    data.failureReason = "Meta Cloud API delivery failure";
  }

  return prisma.message.update({ where: { id: (message as any).id }, data });
}

export async function getWhatsAppMetrics(organizationId: string) {
  const [integration, conversations, messages, delivered, read, failed, templates, recentMessages] = await Promise.all([
    prisma.whatsAppIntegration.findUnique({ where: { organizationId }, include: { defaultAssignee: true } }),
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
