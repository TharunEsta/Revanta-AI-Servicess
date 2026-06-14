"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui";
import { formatTimeInKolkata } from "@/lib/revanta-os/time";

export type ConversationListItem = {
  id: string;
  lead?: {
    fullName?: string | null;
    companyName?: string | null;
    phone?: string | null;
    score?: number | null;
    status?: string | null;
    aiSummary?: unknown;
  } | null;
  company?: { name?: string | null } | null;
  contact?: { phone?: string | null } | null;
  messages: Array<{
    id: string;
    body?: string | null;
    createdAt: Date;
    readAt?: Date | null;
    deliveredAt?: Date | null;
    sentAt?: Date | null;
    direction: "INBOUND" | "OUTBOUND";
  }>;
};

export function ConversationListClient({
  conversations,
  openedConversationId
}: {
  conversations: ConversationListItem[];
  openedConversationId: string | null;
}) {
  const router = useRouter();

  const items = useMemo(() => {

    return conversations
      .map((c) => {
        const lastMessage = c.messages[0] || null;
        const lastActivityAt =
          lastMessage?.readAt || lastMessage?.deliveredAt || lastMessage?.sentAt || lastMessage?.createdAt;

        return {
          ...c,
          _lastMessage: lastMessage,
          _lastActivityAt: lastActivityAt
        };
      })
      .sort((a, b) => {
        const aAt = (a._lastActivityAt as Date | null)?.getTime?.() ?? 0;
        const bAt = (b._lastActivityAt as Date | null)?.getTime?.() ?? 0;
        return bAt - aAt;
      });
  }, [conversations]);

  return (
    <aside className="col-span-3 overflow-hidden rounded-xl border border-slate-200 bg-white">

      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Chat List</div>
        <div className="text-xs text-slate-500">{conversations.length} chats</div>
      </div>

      <div className="h-full overflow-y-auto p-2">
        {items.map((c) => {
          const name =
            c.lead?.companyName || c.lead?.fullName || (c._lastMessage?.body ? "Conversation" : "Conversation");
          const phone = c.lead?.phone || c.contact?.phone || "—";
          const company = c.company?.name || c.lead?.companyName || "—";
          const lastMsg = c._lastMessage?.body || "";
          const lastActivityAt = c._lastActivityAt ? formatTimeInKolkata(c._lastActivityAt) : "";

          const score = c.lead?.score ?? null;
          const stage = c.lead?.status ?? null;

          const opened = openedConversationId === c.id;

          return (
            <Card
              key={c.id}
              className={`mb-2 cursor-pointer rounded-xl border transition-colors ${
                opened ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div
                className="flex gap-3 p-3"
                role="button"
                tabIndex={0}
                onClick={() => {
                  router.push(
                    `/dashboard/conversations?conversationId=${encodeURIComponent(c.id)}`
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    router.push(
                      `/dashboard/conversations?conversationId=${encodeURIComponent(c.id)}`
                    );
                  }
                }}

              >

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{name}</div>
                      <div className="truncate text-xs text-slate-500">{phone}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[11px] font-semibold text-slate-500">{lastActivityAt}</div>
                    </div>
                  </div>

                  <div className="mt-1 truncate text-xs text-slate-600">{company}</div>
                  <div className="mt-2 truncate text-xs text-slate-600">{lastMsg}</div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="text-[11px] font-semibold text-slate-500">Score: {score ?? "—"}</div>
                    <div className="text-[11px] font-semibold text-slate-500">Stage: {stage ?? "—"}</div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {items.length === 0 ? (
          <div className="mt-6 text-center text-sm text-slate-500">No conversations yet.</div>
        ) : null}
      </div>
    </aside>
  );
}

