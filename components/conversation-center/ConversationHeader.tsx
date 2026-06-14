"use client";

import { ConversationStateToggle } from "@/components/conversation-state-toggle";

export function ConversationHeader({
  conversation
}: {
  conversation: {
    id: string;
    aiState: "AI_ACTIVE" | "HUMAN_ACTIVE";
    lead?: { fullName?: string | null; companyName?: string | null; phone?: string | null } | null;
    company?: { name?: string | null } | null;
  } | null;
}) {
  if (!conversation) return null;

  const name = conversation.lead?.fullName || conversation.lead?.companyName || "Conversation";
  const phone = conversation.lead?.phone || "—";
  const company = conversation.company?.name || conversation.lead?.companyName || "—";

  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900">{name}</div>
        <div className="truncate text-xs text-slate-500">
          {phone} · {company}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-xs font-semibold text-slate-500">Quick Actions</div>
        <ConversationStateToggle conversationId={conversation.id} aiState={conversation.aiState} />
      </div>
    </div>
  );
}

