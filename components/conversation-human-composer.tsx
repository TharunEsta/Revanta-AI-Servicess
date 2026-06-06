"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MediaKind = "image" | "audio" | "video" | "document";

function getMediaKind(file: File): MediaKind {
  const mime = file.type || "";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function ConversationHumanComposer({
  conversationId
}: {
  conversationId: string;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const mediaKind = useMemo(() => (file ? getMediaKind(file) : null), [file]);

  useEffect(() => {
    if (!file) {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  async function handlePickFile(accept?: string) {
    if (!fileInputRef.current) return;
    if (accept) fileInputRef.current.accept = accept;
    fileInputRef.current.click();
  }

  function clearAttachment() {
    setFile(null);
  }

  function onTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSend();
    }
  }

  async function onSend() {
    setUploadError(null);
    const trimmed = text.trim();

    const hasText = trimmed.length > 0;
    const hasFile = Boolean(file);

    if (!hasText && !hasFile) {
      setUploadError("Type a message or choose a file.");
      return;
    }

    setSending(true);
    try {
      // Transport selection (must match backend):
      // - Text only => JSON payload (conversationId + text)
      // - File only or Text+File => multipart/form-data (conversationId + (optional) text + file)
      let res: Response;

      if (hasText && !hasFile) {
        res = await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            text: trimmed
          })
        });
      } else {
        const formData = new FormData();
        formData.append("conversationId", conversationId);
        if (hasText) formData.append("text", trimmed);
        // In this branch we always have a file.
        if (file) formData.append("file", file);

        res = await fetch("/api/whatsapp/send", {
          method: "POST",
          body: formData
        });
      }

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Send failed (${res.status}).`);
      }

      // Success: clear + refresh
      setText("");
      clearAttachment();

      // Keep scroll at latest message.
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3">
      {uploadError ? (
        <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {uploadError}
        </div>
      ) : null}

      {file ? (
        <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">Attachment</div>
              <div className="truncate text-sm text-slate-600">{file.name}</div>
              <div className="text-xs text-slate-500">{formatBytes(file.size)}</div>
            </div>
            <button
              type="button"
              className="text-sm text-slate-500 hover:text-slate-700"
              onClick={clearAttachment}
              disabled={sending}
              aria-label="Remove attachment"
            >
              ✕
            </button>
          </div>

          <div className="mt-3">
            {mediaKind === "image" && fileUrl ? (
              <button
                type="button"
                className="block w-full overflow-hidden rounded-xl"
                onClick={() => {
                  if (!fileUrl) return;
                  window.open(fileUrl, "_blank");
                }}
              >
                <img src={fileUrl} alt={file.name} className="max-h-64 w-full object-contain" />
              </button>
            ) : null}

            {mediaKind === "document" ? (
              <div className="flex items-center justify-between gap-3">
                <a
                  href={fileUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm font-medium text-sky-700 hover:underline"
                >
                  {file.name}
                </a>
                <span className="text-xs text-slate-500">Preview</span>
              </div>
            ) : null}

            {mediaKind === "audio" && fileUrl ? (
              <audio controls className="w-full">
                <source src={fileUrl} />
              </audio>
            ) : null}

            {mediaKind === "video" && fileUrl ? (
              <video controls className="w-full max-h-72 rounded-xl">
                <source src={fileUrl} />
              </video>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
        <div className="flex items-end gap-3">
          <div className="flex flex-col items-center">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              onClick={() => handlePickFile()}
              disabled={sending}
              aria-label="Add attachment"
            >
              ＋
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
              }}
              // Let browser accept based on type; server enforces final list.
            />
          </div>

          <div className="min-w-0 flex-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onTextareaKeyDown}
              placeholder="Type a message..."
              className="min-h-[44px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-300"
              disabled={sending}
            />
            <div className="mt-2 text-xs text-slate-500">
              Enter to send · Shift+Enter for newline
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            onClick={() => void onSend()}
            disabled={sending || (!text.trim() && !file)}
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

