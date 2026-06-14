export function normalizePhone(input: string) {
  return input.replace(/[^\d+]/g, "");
}

// Minimal exports required by the codebase.
// These functions are implemented as safe no-ops / placeholders so TypeScript can compile.
// Replace with real WhatsApp integration logic as needed.

type SendWhatsAppMessageResult = {
  message: { id: string };
  externalMessageId: string;
};

export async function sendWhatsAppTextMessage(_args: {
  toPhoneNumber?: string;
  conversationId?: string;
  phoneNumber?: string;
  text: string;
  organizationId?: string;
  metadata?: unknown;
}): Promise<SendWhatsAppMessageResult> {
  return { message: { id: "" }, externalMessageId: "" };
}

export async function sendWhatsAppMediaMessage(_args: {
  toPhoneNumber?: string;
  conversationId?: string;
  phoneNumber?: string;
  mediaUrl: string;
  caption?: string;
  organizationId?: string;
  file?: unknown;
  metadata?: unknown;
}): Promise<SendWhatsAppMessageResult> {
  return { message: { id: "" }, externalMessageId: "" };
}

export async function getWhatsAppMetrics(_args?: any): Promise<{
  conversations?: number;
  messages?: number;
  delivered?: number;
  read?: number;
  failed?: number;
  templates?: number;
  integration?: {
    displayPhoneNumber?: string;
    phoneNumberId?: string;
    businessAccountId?: string;
    defaultAssignee?: { name?: string; email?: string };
    autoCreateLeads?: boolean;
    autoCreateContacts?: boolean;
  } | null;
  recentMessages: Array<any>;
  totalMessages?: number;
  deliveredMessages?: number;
  failedMessages?: number;
}> {
  return {
    conversations: 0,
    messages: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    templates: 0,
    integration: null,
    recentMessages: [],
    totalMessages: 0,
    deliveredMessages: 0,
    failedMessages: 0,
  };
}

export async function recordWhatsAppStatusUpdate(_args: any): Promise<boolean> {
  return true;
}

export async function processIncomingWhatsAppMessage(_args: any): Promise<void> {
  return;
}





export function resolveOrganizationFromPhoneNumberId(
  _phoneNumberId: string,
): string | null {
  return null;
}


