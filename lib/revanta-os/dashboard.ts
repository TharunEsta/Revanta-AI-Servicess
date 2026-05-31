import { prisma } from "@/lib/revanta-os/db";

export async function getDashboardSummary(organizationId: string) {
  const [
    leadCount,
    contactCount,
    companyCount,
    dealCount,
    conversationCount,
    taskCount,
    messageCount,
    aiActivityCount,
    whatsappCount,
    workflowCount,
    workflowRunCount,
    executionLogCount,
    whatsappTemplateCount,
    companyKnowledgeCount,
    knowledgeBaseCount,
    documentCount,
    chunkCount,
    humanActiveConversationCount,
    qualifiedLeadCount,
    activeProjectCount,
    pendingProjectTaskCount,
    upcomingProjectDeadlineCount,
    invoiceCount,
    pendingInvoiceCount,
    paidInvoiceCount,
    subscriptionCount,
    expenseCount,
    proposalCount,
    contractCount,
    supportTicketCount
  ] =
    await Promise.all([
      prisma.lead.count({ where: { organizationId, archivedAt: null } }),
      prisma.contact.count({ where: { organizationId } }),
      prisma.company.count({ where: { organizationId } }),
      prisma.deal.count({ where: { organizationId } }),
      prisma.conversation.count({ where: { organizationId, status: { in: ["OPEN", "PENDING"] } } }),
      prisma.task.count({ where: { organizationId, status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } } }),
      prisma.message.count({ where: { organizationId } }),
      prisma.activity.count({ where: { organizationId, type: { startsWith: "AI_" } } }),
      prisma.message.count({ where: { organizationId, conversation: { channel: "WHATSAPP" } } }),
      prisma.workflow.count({ where: { organizationId, status: "ACTIVE" } }),
      prisma.workflowRun.count({ where: { organizationId } }),
      prisma.executionLog.count({ where: { organizationId } }),
      prisma.whatsAppTemplate.count({ where: { organizationId } }),
      prisma.companyKnowledge.count({ where: { organizationId, status: { not: "ARCHIVED" } } }),
      prisma.knowledgeBase.count({ where: { organizationId, status: { not: "ARCHIVED" } } }),
      prisma.document.count({ where: { organizationId, status: { not: "ARCHIVED" } } }),
      prisma.documentChunk.count({ where: { organizationId } }),
      prisma.conversation.count({ where: { organizationId, aiState: "HUMAN_ACTIVE" } }),
      prisma.lead.count({ where: { organizationId, score: { not: null } } }),
      prisma.project.count({ where: { organizationId, status: "ACTIVE" } }),
      prisma.task.count({ where: { organizationId, projectId: { not: null }, status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } } }),
      prisma.projectMilestone.count({
        where: {
          organizationId,
          status: { notIn: ["DONE", "APPROVED"] },
          dueAt: { gte: new Date(), lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.invoice.count({ where: { organizationId } }),
      prisma.invoice.count({ where: { organizationId, status: { in: ["SENT", "PAST_DUE"] } } }),
      prisma.invoice.count({ where: { organizationId, status: "PAID" } }),
      prisma.subscription.count({ where: { organizationId } }),
      prisma.expense.count({ where: { organizationId } }),
      prisma.proposal.count({ where: { organizationId } }),
      prisma.contract.count({ where: { organizationId } }),
      prisma.supportTicket.count({ where: { organizationId } })
    ]);

  const recentActivities = await prisma.activity.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      actor: true,
      lead: true,
      company: true,
      deal: true,
      project: true
    }
  });

  const latestLeads = await prisma.lead.findMany({
    where: { organizationId, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: {
      owner: true,
      company: true
    }
  });

  const latestConversations = await prisma.conversation.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: {
      lead: true,
      company: true,
      contact: true,
      assignedTo: true,
      messages: { orderBy: { createdAt: "desc" }, take: 3 }
    }
  });

  const recentWorkflowRuns = await prisma.workflowRun.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: {
      workflow: true,
      actor: true
    }
  });

  const recentProjects = await prisma.project.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    take: 6,
    include: {
      company: true,
      lead: true,
      owner: true,
      serviceCatalogItem: true,
      milestones: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 2 },
      tasks: { where: { status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } }, orderBy: { createdAt: "desc" }, take: 2 }
    }
  });

  const recentInvoices = await prisma.invoice.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    take: 6,
    include: { customer: true, project: true, payments: true, items: true }
  });

  const recentSupportTickets = await prisma.supportTicket.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    take: 6,
    include: { project: true, company: true, lead: true, assignee: true, reporter: true, messages: { include: { author: true }, take: 3, orderBy: { createdAt: "desc" } } }
  });

  const recentProposals = await prisma.proposal.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    take: 6,
    include: { lead: true, company: true, deal: true, project: true, owner: true }
  });

  return {
    counts: {
      leadCount,
      contactCount,
      companyCount,
      dealCount,
      conversationCount,
      taskCount,
      messageCount,
      aiActivityCount,
      whatsappCount,
      workflowCount,
      workflowRunCount,
      executionLogCount,
      whatsappTemplateCount,
      companyKnowledgeCount,
      knowledgeBaseCount,
      documentCount,
      chunkCount,
      humanActiveConversationCount,
      qualifiedLeadCount,
      activeProjectCount,
      pendingProjectTaskCount,
      upcomingProjectDeadlineCount,
      invoiceCount,
      pendingInvoiceCount,
      paidInvoiceCount,
      subscriptionCount,
      expenseCount,
      proposalCount,
      contractCount,
      supportTicketCount
    },
    recentActivities,
    latestLeads,
    latestConversations,
    recentWorkflowRuns,
    recentProjects,
    recentInvoices,
    recentSupportTickets,
    recentProposals
  };
}
