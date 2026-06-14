"use client";

import { useEffect, useMemo, useRef } from "react";

import { ConversationHumanComposer } from "@/components/conversation-human-composer";

type Sender = "INBOUND" | "OUTBOUND";

type AttachmentKind = "image" | "audio" | "video" | "document";

type ConversationAttachment = {
  kind: AttachmentKind;
  url: string;
  fileName?: string | null;
};

type ConversationMessage = {
  id: string;
  sender: Sender;
  text?: string | null;
  timestamp?: string | Date | null;
  attachments?: ConversationAttachment[] | null;
};


type Conversation = {
  id: string;
  aiState: "AI_ACTIVE" | "HUMAN_ACTIVE";
  messages?: ConversationMessage[] | null;
};

export function ConversationThread({ conversation }: { conversation: Conversation | null }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const messages = useMemo(() => conversation?.messages ?? [], [conversation]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  function formatTime(ts: unknown) {
    if (!ts) return "";

    // serialization-safe timestamp conversion
    const d =
      ts instanceof Date
        ? ts
        : new Date(String(ts));

    const t = d.getTime();
    if (Number.isNaN(t)) return "";

    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }



  function renderAttachment(att: ConversationAttachment) {
    if (!att.url) return null;

    switch (att.kind) {
      case "image":
        return (
          <a
            key={att.url}
            href={att.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={att.url} alt={att.fileName || "attachment"} className="max-h-72 w-full object-contain" />
          </a>
        );
      case "audio":
        return (
          <div key={att.url} className="mt-2 rounded-xl border border-slate-200 bg-white p-2">
            <audio controls className="w-full">
              <source src={att.url} />
            </audio>
            {att.fileName ? <div className="mt-1 truncate text-xs text-slate-500">{att.fileName}</div> : null}
          </div>
        );
      case "video":
        return (
          <a
            key={att.url}
            href={att.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <video controls className="max-h-72 w-full">
              <source src={att.url} />
            </video>
          </a>
        );
      case "document":
      default:
        return (
          <a
            key={att.url}
            href={att.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
          >
            <span className="text-base">📎</span>
            <span className="truncate max-w-[240px]">{att.fileName || "Attachment"}</span>
          </a>
        );
    }
  }

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500" aria-live="polite">
        Select a conversation
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4" role="log" aria-label="Conversation messages">
        <div className="flex flex-col gap-3">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              No messages yet.
            </div>
          ) : null}

          {messages.map((m) => {
            const isOutbound = m.sender === "OUTBOUND";
            const bubbleClass = isOutbound
              ? "ml-auto max-w-[85%] rounded-2xl bg-sky-600 px-3 py-2 text-white"
              : "mr-auto max-w-[85%] rounded-2xl bg-slate-100 px-3 py-2 text-slate-900";

            return (
              <div key={m.id} className={isOutbound ? "flex justify-end" : "flex justify-start"}>
                <div className={bubbleClass}>
                  {m.text ? <div className="whitespace-pre-wrap text-sm">{m.text}</div> : null}

                  {m.attachments?.length ? (
                    <div className={isOutbound ? "text-white" : "text-slate-900"}>
                      {m.attachments.map(renderAttachment)}
                    </div>
                  ) : null}

                  <div className={isOutbound ? "mt-1 text-right text-xs text-white/80" : "mt-1 text-right text-xs text-slate-500"}>
                    {formatTime(m.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-200 px-4 py-3">
        <ConversationHumanComposer conversationId={conversation.id} />

        <div className="mt-2 text-xs text-slate-500">
          Mode: <span className="font-semibold">{conversation.aiState === "AI_ACTIVE" ? "AI" : "Human"}</span>
        </div>
      </div>
    </div>
  );
}

