import { prisma } from "@/lib/revanta-os/db";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { Card } from "@/components/ui";
import { ConversationStateToggle } from "@/components/conversation-state-toggle";
import { ConversationHumanComposer } from "@/components/conversation-human-composer";
import { formatDayGroupInKolkata, formatTimeInKolkata } from "@/lib/revanta-os/time";


export default async function ConversationsPage() {

  const session = await getSessionUser();
  if (!session?.orgId) return null;

  const conversations = await prisma.conversation.findMany({
    where: { organizationId: session.orgId },
      include: {
      lead: true,
      company: true,
      contact: true,
      assignedTo: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          attachments: true
        }
      }
    },

    orderBy: { updatedAt: "desc" },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Inbox</p>
        <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          Conversations
        </h2>
      </div>

      <div className="grid gap-4">
        {conversations.map((conversation: typeof conversations[number]) => (
          <Card key={conversation.id} className="bg-white">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-slate-950">
                  {conversation.subject || conversation.lead?.companyName || conversation.lead?.fullName || "Conversation"}
                </p>
                <p className="text-sm text-slate-600">
                  {conversation.channel} Â· {conversation.status}
                  {conversation.assignedTo?.name ? ` Â· ${conversation.assignedTo.name}` : ""}
                  {conversation.threadId ? ` Â· ${conversation.threadId}` : ""}
                  {conversation.aiState ? ` Â· ${conversation.aiState}` : ""}
                </p>
                {conversation.lead?.meetingScheduled ? (
                  <p className="mt-2 text-xs text-sky-700">
                    Meeting booked on{" "}
                    {conversation.lead.meetingBookedAt
                      ? new Intl.DateTimeFormat("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        }).format(new Date(conversation.lead.meetingBookedAt))
                      : "not set"}
                    {conversation.lead.calendlyEventId ? ` · Event ${conversation.lead.calendlyEventId}` : ""}
                  </p>
                ) : null}
              </div>
              <ConversationStateToggle conversationId={conversation.id} aiState={conversation.aiState as "AI_ACTIVE" | "HUMAN_ACTIVE"} />
            </div>
            <div className="mt-4 space-y-2">
              {(() => {

                const formatDayGroup = formatDayGroupInKolkata;
                const formatTime = (d: Date) => formatTimeInKolkata(d);


                const msgTime = (m: typeof conversation.messages[number]) =>
                  m.readAt || m.deliveredAt || m.sentAt || m.createdAt;

                const statusIcon = (m: typeof conversation.messages[number]) => {
                  if (m.direction !== "OUTBOUND") return null;
                  if (m.readAt) return "âœ“âœ“";
                  if (m.deliveredAt) return "âœ“âœ“";
                  if (m.sentAt) return "âœ“";
                  return "";
                };

                const statusIconColor = (m: typeof conversation.messages[number]) => {
                  if (m.direction !== "OUTBOUND") return "text-slate-400";
                  if (m.readAt) return "text-sky-600";
                  if (m.deliveredAt) return "text-slate-600";
                  return "text-slate-400";
                };

                const sorted = [...conversation.messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                let lastGroup: string | null = null;

                return sorted.map((message) => {
                  const d = msgTime(message) as Date;
                  const group = formatDayGroup(d);
                  const showGroup = group !== lastGroup;
                  lastGroup = group;

                  const icon = statusIcon(message);
                  const iconColor = statusIconColor(message);
                  const time = formatTime(d);

                  return (
                    <div key={message.id}>
                      {showGroup ? (
                        <div className="my-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{group}</div>
                      ) : null}
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-slate-900">{message.direction}</div>

                            {message.attachments && message.attachments.length > 0 ? (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((att: any) => {
                                  const url = att.url || undefined;
                                  const mime = att.mimeType || att.metadata?.mimeType || "";
                                  const type = (mime.startsWith("image/") && "image") ||
                                    (mime.startsWith("video/") && "video") ||
                                    (mime.startsWith("audio/") && "audio") ||
                                    (mime ? "document" : "document");

                                  return (
                                    <div key={att.id} className="space-y-2">
                                      {type === "image" && url ? (
                                        <div>
                                          <button
                                            type="button"
                                            className="block w-full overflow-hidden rounded-xl"
                                            onClick={() => window.open(url, "_blank")}
                                          >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={url} alt={att.fileName} className="max-h-72 w-full object-contain" />
                                          </button>
                                          <div className="mt-2 flex items-center gap-3">
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-xs font-semibold text-sky-700 hover:underline"
                                            >
                                              Download
                                            </a>
                                          </div>
                                        </div>
                                      ) : null}

                                      {type === "video" && url ? (
                                        <div>
                                          <video controls className="w-full max-h-72 rounded-xl">
                                            <source src={url} />
                                          </video>
                                          <div className="mt-2 flex items-center gap-3">
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-xs font-semibold text-sky-700 hover:underline"
                                            >
                                              Download
                                            </a>
                                          </div>
                                        </div>
                                      ) : null}

                                      {type === "audio" && url ? (
                                        <div>
                                          <audio controls className="w-full">
                                            <source src={url} />
                                          </audio>
                                          <div className="mt-2 flex items-center gap-3">
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-xs font-semibold text-sky-700 hover:underline"
                                            >
                                              Download
                                            </a>
                                          </div>
                                        </div>
                                      ) : null}

                                      {type === "document" && url ? (
                                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                                          <div className="truncate text-sm font-semibold text-slate-900">{att.fileName}</div>
                                          <div className="mt-2">
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-xs font-semibold text-sky-700 hover:underline"
                                            >
                                              Download
                                            </a>
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="break-words">{message.body}</div>
                            )}
                          </div>

                          <div className={`shrink-0 text-right text-xs ${message.direction === "OUTBOUND" ? "" : "text-slate-500"}`}>
                            <div className="whitespace-nowrap">{time}</div>
                            {icon ? <div className={`${iconColor} mt-1 font-semibold`}>{icon}</div> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {conversation.aiState === "HUMAN_ACTIVE" ? (
              <ConversationHumanComposer conversationId={conversation.id} />
            ) : null}

          </Card>
        ))}
      </div>
    </div>
  );
}
