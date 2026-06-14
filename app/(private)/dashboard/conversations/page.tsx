import { prisma } from "@/lib/revanta-os/db";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { ConversationListClient } from "@/components/conversation-center/ConversationList";
import { ConversationThread } from "@/components/conversation-center/ConversationThread";
import { ConversationInsights } from "@/components/conversation-center/ConversationInsights";
import { ConversationHeader } from "@/components/conversation-center/ConversationHeader";



export default async function ConversationsPage({
  searchParams
}: {
  searchParams: Promise<{ conversationId?: string }>;
}) {

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
        take: 25,
        include: {
          attachments: true
        }
      }
    },
    orderBy: { updatedAt: "desc" },
    take: 100
  });

  const resolvedSearchParams = await searchParams;
  const conversationId = resolvedSearchParams?.conversationId;

  // Pick an opened conversation (URL conversationId if provided; else first in the list)
  const opened = (conversationId
    ? conversations.find((c: any) => c.id === conversationId) || null
    : conversations[0] ?? null) as any;



  return (
    <div className="h-[calc(100vh-12rem)]">
      <div className="pb-4">
        <p className="eyebrow">Inbox</p>
        <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          Conversations
        </h2>
      </div>

        <div className="grid h-[calc(100vh-16rem)] grid-cols-12 gap-4">

        {/* LEFT PANEL */}
        <ConversationListClient
          conversations={conversations as any}
          openedConversationId={opened?.id ?? null}
        />




        {/* CENTER PANEL */}
        <div className="col-span-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <ConversationHeader
            conversation={opened
              ? ({
                  id: opened.id,
                  aiState: opened.aiState,
                  lead: opened.lead,
                  company: opened.company
                } as any)
              : null}
          />
          <ConversationThread
            conversation={opened
              ? ({
                  id: opened.id,
                  aiState: opened.aiState,
                  lead: opened.lead,
                  company: opened.company,
                  contact: opened.contact,
                  assignedTo: opened.assignedTo,
                  messages: opened.messages
                } as any)
              : null}
          />
        </div>

        {/* RIGHT PANEL */}
        <ConversationInsights
          conversation={
            opened
              ? ({
                  lead: opened.lead,
                  assignedTo: opened.assignedTo
                } as any)
              : null
          }
        />
      </div>
    </div>
  );
}

