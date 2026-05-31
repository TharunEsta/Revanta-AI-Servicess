import { prisma } from "@/lib/revanta-os/db";

function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && value && "toString" in value) {
    return Number(value.toString()) || 0;
  }
  return 0;
}

function buildTimelineItems(params: {
  activities: Array<{ id: string; type: string; title: string; body: string | null; createdAt: Date }>;
  messages: Array<{
    id: string;
    direction: string;
    body: string;
    status: string | null;
    createdAt: Date;
    conversation: { subject: string | null; channel: string; status: string };
  }>;
  tasks: Array<{ id: string; title: string; status: string; dueAt: Date | null; createdAt: Date }>;
  deals: Array<{ id: string; title: string; stage: string; amount: unknown; updatedAt: Date }>;
  projects: Array<{ id: string; name: string; status: string; updatedAt: Date }>;
  conversations: Array<{ id: string; subject: string | null; status: string; channel: string; updatedAt: Date }>;
}) {
  const timeline = [
    ...params.activities.map((activity) => ({
      kind: "activity",
      id: activity.id,
      title: activity.title,
      detail: activity.body || activity.type,
      date: activity.createdAt
    })),
    ...params.messages.map((message) => ({
      kind: "message",
      id: message.id,
      title: `${message.direction} ${message.conversation.channel} message`,
      detail: message.body,
      date: message.createdAt
    })),
    ...params.tasks.map((task) => ({
      kind: "task",
      id: task.id,
      title: task.title,
      detail: `${task.status}${task.dueAt ? ` · due ${task.dueAt.toISOString()}` : ""}`,
      date: task.createdAt
    })),
    ...params.deals.map((deal) => ({
      kind: "deal",
      id: deal.id,
      title: deal.title,
      detail: `${deal.stage} · ${toNumber(deal.amount).toFixed(2)}`,
      date: deal.updatedAt
    })),
    ...params.projects.map((project) => ({
      kind: "project",
      id: project.id,
      title: project.name,
      detail: project.status,
      date: project.updatedAt
    })),
    ...params.conversations.map((conversation) => ({
      kind: "conversation",
      id: conversation.id,
      title: conversation.subject || "Conversation",
      detail: `${conversation.channel} · ${conversation.status}`,
      date: conversation.updatedAt
    }))
  ];

  return timeline.sort((left, right) => right.date.getTime() - left.date.getTime());
}

export async function getCustomer360Profile(organizationId: string, customerId: string) {
  const [lead, contact, company] = await Promise.all([
    prisma.lead.findFirst({
      where: { id: customerId, organizationId },
      include: {
        company: true,
        contact: { include: { company: true } },
        owner: true,
        deals: true,
        projects: true,
        conversations: {
          include: { messages: { orderBy: { createdAt: "desc" }, take: 20 }, assignedTo: true },
          orderBy: { updatedAt: "desc" }
        },
        messages: {
          include: { conversation: true },
          orderBy: { createdAt: "desc" }
        },
        tasks: true,
        activities: {
          orderBy: { createdAt: "desc" },
          take: 100
        }
      }
    }),
    prisma.contact.findFirst({
      where: { id: customerId, organizationId },
      include: { company: true, lead: true, conversations: true }
    }),
    prisma.company.findFirst({
      where: { id: customerId, organizationId },
      include: { leads: true, contacts: true, conversations: true, deals: true, projects: true, activities: true }
    })
  ]);

  const resolvedLead =
    lead ||
    (contact?.lead
      ? await prisma.lead.findFirst({
          where: { id: contact.lead.id, organizationId },
          include: {
            company: true,
            contact: { include: { company: true } },
            owner: true,
            deals: true,
            projects: true,
            conversations: {
              include: { messages: { orderBy: { createdAt: "desc" }, take: 20 }, assignedTo: true },
              orderBy: { updatedAt: "desc" }
            },
            messages: {
              include: { conversation: true },
              orderBy: { createdAt: "desc" }
            },
            tasks: true,
            activities: {
              orderBy: { createdAt: "desc" },
              take: 100
            }
          }
        })
      : company?.leads[0]
        ? await prisma.lead.findFirst({
            where: { id: company.leads[0].id, organizationId },
            include: {
              company: true,
              contact: { include: { company: true } },
              owner: true,
              deals: true,
              projects: true,
              conversations: {
                include: { messages: { orderBy: { createdAt: "desc" }, take: 20 }, assignedTo: true },
                orderBy: { updatedAt: "desc" }
              },
              messages: {
                include: { conversation: true },
                orderBy: { createdAt: "desc" }
              },
              tasks: true,
              activities: {
                orderBy: { createdAt: "desc" },
                take: 100
              }
            }
          })
        : null);

  const resolvedContact = contact || resolvedLead?.contact || null;
  const resolvedCompany = company || resolvedLead?.company || resolvedContact?.company || null;
  const companyLeadIds = company?.leads.map((item: { id: string }) => item.id) || [];
  const relatedLeadIds = Array.from(
    new Set(
      [
        resolvedLead?.id,
        resolvedContact?.leadId,
        ...companyLeadIds
      ].filter((value): value is string => Boolean(value))
    )
  );

  const conversations = resolvedLead
    ? resolvedLead.conversations
    : await prisma.conversation.findMany({
        where: {
          organizationId,
          OR: [
            ...(resolvedContact ? [{ contactId: resolvedContact.id }] : []),
            ...(resolvedCompany ? [{ companyId: resolvedCompany.id }] : []),
            ...(relatedLeadIds.length ? [{ leadId: { in: relatedLeadIds } }] : [])
          ]
        },
        include: { messages: { orderBy: { createdAt: "desc" }, take: 20 }, assignedTo: true },
        orderBy: { updatedAt: "desc" }
      });

  const messages = resolvedLead
    ? resolvedLead.messages
    : conversations.length
      ? await prisma.message.findMany({
          where: {
            organizationId,
            conversationId: { in: conversations.map((conversationRecord) => conversationRecord.id) }
          },
          include: { conversation: true },
          orderBy: { createdAt: "desc" }
        })
      : [];

  const tasks = resolvedLead
    ? resolvedLead.tasks
    : relatedLeadIds.length
      ? await prisma.task.findMany({
          where: {
            organizationId,
            leadId: { in: relatedLeadIds }
          },
          orderBy: { updatedAt: "desc" }
        })
      : [];

  const deals = resolvedLead
    ? resolvedLead.deals
    : await prisma.deal.findMany({
        where: {
          organizationId,
          OR: [
            ...(resolvedCompany ? [{ companyId: resolvedCompany.id }] : []),
            ...(relatedLeadIds.length ? [{ leadId: { in: relatedLeadIds } }] : [])
          ]
        },
        orderBy: { updatedAt: "desc" }
      });

  const projects = resolvedLead
    ? resolvedLead.projects
    : await prisma.project.findMany({
        where: {
          organizationId,
          OR: [
            ...(resolvedCompany ? [{ companyId: resolvedCompany.id }] : []),
            ...(relatedLeadIds.length ? [{ leadId: { in: relatedLeadIds } }] : [])
          ]
        },
        orderBy: { updatedAt: "desc" }
      });

  const activities = resolvedLead
    ? resolvedLead.activities
    : await prisma.activity.findMany({
        where: {
          organizationId,
          OR: [
            ...(relatedLeadIds.length ? [{ leadId: { in: relatedLeadIds } }] : []),
            ...(resolvedCompany ? [{ companyId: resolvedCompany.id }] : [])
          ]
        },
        orderBy: { createdAt: "desc" }
      });

  const wonRevenue = deals
    .filter((deal) => deal.stage === "WON")
    .reduce((sum, deal) => sum + toNumber(deal.amount), 0);

  const openOpportunities = deals.filter((deal) => !["WON", "LOST", "ARCHIVED"].includes(deal.stage));

  const openTasks = tasks.filter((task) => !["COMPLETED", "CANCELED"].includes(task.status));

  const whatsappMessages = messages.filter((message) => message.conversation.channel === "WHATSAPP");

  const aiSummary = resolvedLead?.aiSummary || resolvedLead?.qualificationNotes || null;
  const timeline = buildTimelineItems({
    activities,
    messages,
    tasks,
    deals,
    projects,
    conversations
  });

  return {
    lead: resolvedLead,
    contact: resolvedContact,
    company: resolvedCompany,
    conversations,
    messages,
    tasks,
    deals,
    projects,
    activities,
    timeline,
    openTasks,
    openOpportunities,
    whatsappMessages,
    aiSummary,
    revenue: wonRevenue,
    metrics: {
      conversationCount: conversations.length,
      whatsappMessageCount: whatsappMessages.length,
      taskCount: openTasks.length,
      opportunityCount: openOpportunities.length,
      revenue: wonRevenue
    }
  };
}
