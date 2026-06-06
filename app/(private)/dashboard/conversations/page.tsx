import { prisma } from "@/lib/revanta-os/db";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { Card } from "@/components/ui";
import { ConversationStateToggle } from "@/components/conversation-state-toggle";
import { ConversationHumanComposer } from "@/components/conversation-human-composer";

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
      messages: { orderBy: { createdAt: "desc" }, take: 5 }
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

                const now = new Date();
                const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const yesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
                const formatTime = (d: Date) =>
                  new Intl.DateTimeFormat("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                  }).format(d);

                const formatDayGroup = (d: Date) => {
                  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                  if (t === startOfToday.getTime()) return "Today";
                  if (t === yesterday.getTime()) return "Yesterday";
                  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(d);
                };

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
                            <div className="break-words">{message.body}</div>
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
              <ConversationHumanComposer
                conversationId={conversation.id}
                onAfterSend={() => {
                  // Conversation refresh happens via router refresh inside the composer.
                  // Kept intentionally empty here.
                }}
              />
            ) : null}

          </Card>
        ))}
      </div>
    </div>
  );
}
