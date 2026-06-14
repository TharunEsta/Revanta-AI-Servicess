export type ConversationMode = "PERSONAL" | "BUSINESS" | "MIXED";

export type ModeTransition = {
  from: ConversationMode;
  to: ConversationMode;
  reason: string;
};

const BUSINESS_KEYWORDS = [
  // pricing / cost
  "price",
  "pricing",
  "cost",
  "quote",
  "estimate",
  "budget",
  "fee",
  "charges",
  "pricing details",

  // services / product
  "service",
  "services",
  "product",
  "software",
  "crm",
  "automation",
  "workflow",
  "ai",
  "agent",
  "website",
  "app",
  "platform",
  "integration",

  // appointment / booking
  "appointment",
  "appoint",
  "book",
  "booking",
  "schedule",
  "call",
  "meeting",
  "demo",
  "discovery",
  "zoom",
  "teams",
  "google meet",
  "calendly",

  // support / help (business-support intent)
  "support",
  "help",
  "issue",
  "problem",
  "bug",
  "ticket",

  // conversion phrases
  "how much",
  "how do i",
  "can you",
  "i want",
  "need"
];

const PERSONAL_HINT_KEYWORDS = [
  // greetings / casual
  "hi",
  "hello",
  "hey",
  "bro",
  "buddy",
  "friend",
  "sare",
  "anna",
  "tammu",
  "ra",
  "raaa",

  // casual questions
  "how are you",
  "how u",
  "em chesthunav",
  "em chesthunnav",
  "em chesthunna",
  "busy",
  "work",
  "timepass",

  // chit-chat
  "hahaha",
  "haha",
  "lol",
  "😄",
  "😁",
  "🤣",
  "😂",

  // emoji heavy casual
  "👍",
  "🙏",
  "❤️"
];

function normalize(text: string) {
  return (text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(haystack: string, keywords: string[]) {
  return keywords.some((k) => {
    if (!k) return false;
    return haystack.includes(k.toLowerCase());
  });
}

export function classifyConversationMode(params: {
  inboundText: string;
  recentMessagesText?: string;
  currentMode?: ConversationMode | null;
}): { mode: ConversationMode; confidence: number; reason: string } {
  const inbound = normalize(params.inboundText);
  const recent = normalize(params.recentMessagesText || "");
  const combined = `${inbound} ${recent}`.trim();

  const hasBusiness = containsAny(combined, BUSINESS_KEYWORDS);
  const hasPersonal = containsAny(combined, PERSONAL_HINT_KEYWORDS);

  // Safety: if business intent is detected, it always takes priority.
  if (hasBusiness && !hasPersonal) {
    return { mode: "BUSINESS", confidence: 0.9, reason: "Business intent keywords detected" };
  }

  // Mixed when both are detected.
  if (hasBusiness && hasPersonal) {
    return { mode: "MIXED", confidence: 0.75, reason: "Business + casual keywords detected" };
  }

  // If no business intent, personal wins by default.
  if (!hasBusiness && hasPersonal) {
    return { mode: "PERSONAL", confidence: 0.7, reason: "Casual keywords detected" };
  }

  // Default fallback: PERSONAL.
  if (!hasBusiness && !hasPersonal) {
    return { mode: "PERSONAL", confidence: 0.5, reason: "No business keywords detected; defaulting to personal" };
  }

  // Should not reach.
  return { mode: params.currentMode || "PERSONAL", confidence: 0.4, reason: "Fallback" };
}

export function decideFinalMode(params: {
  classified: ConversationMode;
  currentMode?: ConversationMode | null;
  lastAssistantMessage?: string;
}): { finalMode: ConversationMode; reason: string } {
  const { classified, currentMode } = params;

  // Always prioritize business.
  if (classified === "BUSINESS") return { finalMode: "BUSINESS", reason: "Business intent takes priority" };

  // Mixed should transition into BUSINESS if we detect business intent in latest text again.
  // Without deep context, keep MIXED as the intermediate mode.
  if (classified === "MIXED") return { finalMode: "MIXED", reason: "Casual + business detected" };

  // Personal.
  if (classified === "PERSONAL") {
    // If current is BUSINESS, keep BUSINESS unless clearly personal-only.
    if (currentMode === "BUSINESS") {
      return { finalMode: "BUSINESS", reason: "Staying in Business mode until explicit business intent appears again" };
    }
    return { finalMode: "PERSONAL", reason: "Keeping/entering personal mode" };
  }

  return { finalMode: currentMode || "PERSONAL", reason: "Default" };
}

export function formatModeTransitionLog(transition: ModeTransition) {
  return `Mode transition: ${transition.from} -> ${transition.to}. Reason: ${transition.reason}`;
}

