import { prisma } from "@/lib/revanta-os/db";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { Card } from "@/components/ui";
import { ConversationStateToggle } from "@/components/conversation-state-toggle";

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
        {conversations.map((conversation) => (
          <Card key={conversation.id} className="bg-white">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-slate-950">
                  {conversation.subject || conversation.lead?.companyName || conversation.lead?.fullName || "Conversation"}
                </p>
                <p className="text-sm text-slate-600">
                  {conversation.channel} · {conversation.status}
                  {conversation.assignedTo?.name ? ` · ${conversation.assignedTo.name}` : ""}
                  {conversation.threadId ? ` · ${conversation.threadId}` : ""}
                  {conversation.aiState ? ` · ${conversation.aiState}` : ""}
                </p>
              </div>
              <ConversationStateToggle conversationId={conversation.id} aiState={conversation.aiState as "AI_ACTIVE" | "HUMAN_ACTIVE"} />
            </div>
            <div className="mt-4 space-y-2">
              {conversation.messages.map((message) => (
                <div key={message.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {message.direction} · {message.body}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
