import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/revanta-os/db";
import { runAIPrompt } from "@/lib/revanta-os/ai";
import { triggerWorkflowEvent } from "@/lib/revanta-os/workflows";
import { createNotification } from "@/lib/revanta-os/notifications";
import { toJsonValue } from "@/lib/revanta-os/json";

function moneyNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return 0;
  return Number(value);
}

function sumAmount(
  items: Array<{ amount?: Prisma.Decimal | number; total?: Prisma.Decimal | number }>
) {
  return items.reduce((acc: number, item) => acc + moneyNumber(item.amount ?? item.total ?? 0), 0);
}

function buildInvoiceNumber(index: number) {
  return `INV-${new Date().getFullYear()}-${String(index).padStart(4, "0")}`;
}

async function nextInvoiceNumber(organizationId: string) {
  const count = await prisma.invoice.count({ where: { organizationId } });
  return buildInvoiceNumber(count + 1);
}

export async function getRevenueMetrics(organizationId: string) {
  const [invoices, payments, expenses, subscriptions, activeClients, pipelineValue, activeProjects, pendingPayments] =
    await Promise.all([
      prisma.invoice.findMany({ where: { organizationId } }),
      prisma.payment.findMany({ where: { organizationId } }),
      prisma.expense.findMany({ where: { organizationId } }),
      prisma.subscription.count({ where: { organizationId, status: "ACTIVE" } }),
      prisma.company.count({ where: { organizationId } }),
      prisma.deal.aggregate({
        where: { organizationId, stage: { in: ["DISCOVERY", "QUALIFIED", "PROPOSAL", "NEGOTIATION"] } },
        _sum: { amount: true }
      }),
      prisma.project.count({ where: { organizationId, status: "ACTIVE" } }),
      prisma.invoice.count({ where: { organizationId, status: { in: ["SENT", "PAST_DUE"] } } })
    ]);

  const totalInvoiced = sumAmount(invoices);
  const totalPaid = sumAmount(
    payments.filter((payment: { status?: string | null }) => payment.status === "SUCCEEDED")
  );
  const totalExpenses = sumAmount(expenses);
const overdueInvoices = invoices.filter((invoice: { status: string }) => invoice.status === "PAST_DUE").length;

  return {
    totalInvoiced,
    totalPaid,
    totalExpenses,
    pendingPayments,
    overdueInvoices,
    activeClients,
    pipelineValue: moneyNumber(pipelineValue._sum.amount),
    activeProjects,
    activeSubscriptions: subscriptions,
    revenue: totalPaid - totalExpenses,
    invoices,
    payments,
    expenses
  };
}

export async function generateInvoiceFromProject(params: {
  organizationId: string;
  projectId: string;
  userId?: string | null;
}) {
  const project = await prisma.project.findFirst({
    where: { id: params.projectId, organizationId: params.organizationId },
    include: { deal: true, company: true, lead: true, serviceCatalogItem: true, milestones: true, tasks: true }
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const existing = await prisma.invoice.findFirst({
    where: { organizationId: params.organizationId, projectId: project.id }
  });

  if (existing) {
    return existing;
  }

  const invoiceNumber = await nextInvoiceNumber(params.organizationId);
  const baseAmount =
    project.deal?.amount != null
      ? moneyNumber(project.deal.amount)
      : Math.max(1, (project.estimatedHours || project.tasks.length || 1) * 2500);
  const taxAmount = Math.round(baseAmount * 0.18 * 100) / 100;
  const totalAmount = Math.round((baseAmount + taxAmount) * 100) / 100;

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: params.organizationId,
      projectId: project.id,
      customerId: project.companyId || project.lead?.companyId || null,
      createdById: params.userId || project.ownerId || null,
      number: invoiceNumber,
      status: "DRAFT",
      subtotal: baseAmount,
      tax: taxAmount,
      total: totalAmount,
      currency: project.deal?.currency || "USD",
      notes: project.summary || project.requirementsSummary || project.requirements || null,
      items: {
        create: [
          {
            organizationId: params.organizationId,
            projectId: project.id,
            title: project.serviceCatalogItem?.name || project.serviceType || project.name,
            description: project.summary || project.requirementsSummary || project.requirements || null,
            quantity: 1,
            unitPrice: baseAmount,
            tax: taxAmount,
            amount: totalAmount,
            metadata: toJsonValue({
              projectId: project.id,
              dealId: project.dealId,
              serviceType: project.serviceType
            })
          }
        ]
      }
    },
    include: { items: true, customer: true, project: true, payments: true }
  });

    await prisma.transaction.create({
      data: {
        organizationId: params.organizationId,
        invoiceId: invoice.id,
        type: "INCOME",
        amount: invoice.total,
      currency: invoice.currency,
      description: `Invoice generated for ${project.name}`,
      occurredAt: new Date(),
      metadata: toJsonValue({ invoiceId: invoice.id, projectId: project.id })
    }
  });

  await prisma.activity.create({
    data: {
      organizationId: params.organizationId,
      actorId: params.userId || project.ownerId || null,
      projectId: project.id,
      type: "INVOICE_CREATED",
      title: `Invoice created: ${invoice.number}`,
      body: `${invoice.currency} ${invoice.total.toString()}`,
      metadata: toJsonValue({ invoiceId: invoice.id, total: invoice.total.toString() })
    }
  });

  await createNotification({
    organizationId: params.organizationId,
    userId: params.userId || project.ownerId || null,
    type: "INVOICE_CREATED",
    title: `Invoice created: ${invoice.number}`,
    body: `${project.name} invoice total ${invoice.total.toString()} ${invoice.currency}`,
    metadata: { invoiceId: invoice.id, projectId: project.id }
  });

  await triggerWorkflowEvent({
    organizationId: params.organizationId,
    actorId: params.userId || project.ownerId || null,
    eventType: "INVOICE_CREATED",
    payload: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      projectId: project.id,
      total: invoice.total.toString(),
      currency: invoice.currency
    }
  });

  return invoice;
}

export async function recordPayment(params: {
  organizationId: string;
  invoiceId: string;
  amount: number;
  provider: string;
  providerRef?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.invoiceId, organizationId: params.organizationId },
    include: { payments: true, project: true }
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  const payment = await prisma.payment.create({
    data: {
      organizationId: params.organizationId,
      invoiceId: invoice.id,
      recordedById: params.userId || null,
      provider: params.provider,
      providerRef: params.providerRef || null,
      status: "SUCCEEDED",
      amount: params.amount,
      currency: invoice.currency,
      paidAt: new Date(),
      metadata: toJsonValue(params.metadata || {})
    }
  });

  await prisma.transaction.create({
    data: {
      organizationId: params.organizationId,
      invoiceId: invoice.id,
      type: "INCOME",
      amount: params.amount,
      currency: invoice.currency,
      description: `Payment received via ${params.provider}`,
      occurredAt: new Date(),
      metadata: toJsonValue({ paymentId: payment.id, providerRef: params.providerRef || null })
    }
  });

  await createNotification({
    organizationId: params.organizationId,
    userId: params.userId || invoice.createdById || null,
    type: "PAYMENT_RECEIVED",
    title: `Payment received for ${invoice.number}`,
    body: `${params.amount} ${invoice.currency} via ${params.provider}`,
    metadata: { invoiceId: invoice.id, paymentId: payment.id }
  });

  const paidTotal = invoice.payments.reduce((total: number, current: { amount: Prisma.Decimal | number | null }) => total + moneyNumber(current.amount), 0) + params.amount;
  const invoiceStatus = paidTotal >= moneyNumber(invoice.total) ? "PAID" : "SENT";

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: invoiceStatus,
      paidAt: invoiceStatus === "PAID" ? new Date() : undefined
    }
  });

  if (invoice.projectId) {
    await prisma.activity.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.userId || null,
        projectId: invoice.projectId,
        type: "PAYMENT_RECEIVED",
        title: `Payment received for ${invoice.number}`,
        body: `${invoice.currency} ${params.amount}`,
        metadata: toJsonValue({ paymentId: payment.id, invoiceId: invoice.id })
      }
    });
  }

  await triggerWorkflowEvent({
    organizationId: params.organizationId,
    actorId: params.userId || null,
    eventType: "PAYMENT_RECEIVED",
    payload: {
      invoiceId: invoice.id,
      paymentId: payment.id,
      amount: params.amount,
      currency: invoice.currency,
      provider: params.provider
    }
  });

  return payment;
}

export async function generateProposalFromLead(params: {
  organizationId: string;
  leadId: string;
  userId?: string | null;
  requirements?: string | null;
}) {
  const lead = await prisma.lead.findFirst({
    where: { id: params.leadId, organizationId: params.organizationId },
    include: { company: true, contact: true, owner: true }
  });

  if (!lead) {
    throw new Error("Lead not found.");
  }

  const prompt = JSON.stringify({
    leadId: lead.id,
    companyName: lead.companyName || lead.company?.name || null,
    fullName: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    website: lead.website,
    category: lead.category,
    notes: lead.notes,
    requirements: params.requirements || lead.notes || ""
  });

  const ai = await runAIPrompt({
    organizationId: params.organizationId,
    userId: params.userId || lead.ownerId || null,
    purpose: "chat",
    prompt,
    parseJson: true,
    system:
      "Generate a proposal summary for Revanta AI. Return JSON with requirementSummary, scope, deliverables, timeline, approvalTracking, and nextSteps."
  });

  const parsed = (ai.parsed || {}) as Record<string, unknown>;
  const proposal = await prisma.proposal.create({
    data: {
      organizationId: params.organizationId,
      leadId: lead.id,
      companyId: lead.companyId || lead.company?.id || null,
      ownerId: params.userId || lead.ownerId || null,
      status: "DRAFT",
      title: `${lead.companyName || lead.fullName || "Lead"} proposal`,
      requirementSummary:
        typeof parsed.requirementSummary === "string" ? parsed.requirementSummary : params.requirements || lead.notes || null,
      scope: typeof parsed.scope === "string" ? parsed.scope : undefined,
      deliverables: parsed.deliverables && typeof parsed.deliverables === "object" ? toJsonValue(parsed.deliverables) : undefined,
      timeline: parsed.timeline && typeof parsed.timeline === "object" ? toJsonValue(parsed.timeline) : undefined,
      approvalStatus: "PENDING",
      aiSummary: toJsonValue({
        provider: ai.provider,
        output: ai.output,
        parsed: ai.parsed
      }),
      metadata: toJsonValue({ leadId: lead.id, companyId: lead.companyId, companyName: lead.companyName })
    }
  });

  return proposal;
}

export async function approveProposal(params: {
  organizationId: string;
  proposalId: string;
  userId?: string | null;
}) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: params.proposalId, organizationId: params.organizationId },
    include: { lead: true, company: true, deal: true, project: true, owner: true }
  });

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  const updatedProposal = await prisma.proposal.update({
    where: { id: proposal.id },
    data: {
      status: "APPROVED",
      approvalStatus: "APPROVED",
      approvedAt: new Date()
    }
  });

  let deal = proposal.deal;
  if (!deal) {
    deal = await prisma.deal.create({
      data: {
        organizationId: params.organizationId,
        companyId: proposal.companyId || proposal.lead?.companyId || null,
        leadId: proposal.leadId || null,
        ownerId: params.userId || proposal.ownerId || null,
        title: proposal.title,
        serviceType: proposal.scope || undefined,
        stage: "WON",
        amount: undefined,
        notes: proposal.requirementSummary || proposal.scope || null
      }
    });
  } else {
    await prisma.deal.update({
      where: { id: deal.id },
      data: { stage: "WON", notes: proposal.requirementSummary || proposal.scope || undefined }
    });
  }

  const contract = await prisma.contract.create({
    data: {
      organizationId: params.organizationId,
      proposalId: proposal.id,
      dealId: deal.id,
      companyId: proposal.companyId || proposal.lead?.companyId || null,
      leadId: proposal.leadId || null,
      ownerId: params.userId || proposal.ownerId || null,
      status: "APPROVED",
      title: proposal.title,
      scope: proposal.scope || proposal.requirementSummary || null,
      deliverables: proposal.deliverables || undefined,
      timeline: proposal.timeline || undefined,
      approvalStatus: "APPROVED",
      approvedAt: new Date(),
      metadata: toJsonValue({ proposalId: proposal.id })
    }
  });

  await prisma.statementOfWork.create({
    data: {
      organizationId: params.organizationId,
      contractId: contract.id,
      title: `${proposal.title} SOW`,
      scope: contract.scope || undefined,
      deliverables: contract.deliverables || undefined,
      timeline: contract.timeline || undefined,
      approvalStatus: "APPROVED",
      approvedAt: new Date(),
      metadata: toJsonValue({ contractId: contract.id, proposalId: proposal.id })
    }
  });

  await prisma.activity.create({
    data: {
      organizationId: params.organizationId,
      actorId: params.userId || proposal.ownerId || null,
      leadId: proposal.leadId || null,
      dealId: deal.id,
      type: "PROPOSAL_APPROVED",
      title: `Proposal approved: ${proposal.title}`,
      body: proposal.requirementSummary || proposal.scope || null,
      metadata: toJsonValue({ proposalId: proposal.id, contractId: contract.id })
    }
  });

  await createNotification({
    organizationId: params.organizationId,
    userId: params.userId || proposal.ownerId || null,
    type: "PROPOSAL_APPROVED",
    title: `Proposal approved: ${proposal.title}`,
    body: `Deal ${deal.id} moved to won.`,
    metadata: { proposalId: proposal.id, dealId: deal.id, contractId: contract.id }
  });

  await triggerWorkflowEvent({
    organizationId: params.organizationId,
    actorId: params.userId || proposal.ownerId || null,
    eventType: "PROPOSAL_APPROVED",
    payload: {
      proposalId: proposal.id,
      contractId: contract.id,
      dealId: deal.id,
      leadId: proposal.leadId || null,
      companyId: proposal.companyId || null
    }
  });

  return { proposal: updatedProposal, contract, deal };
}

export async function createSupportTicket(params: {
  organizationId: string;
  userId?: string | null;
  leadId?: string | null;
  companyId?: string | null;
  projectId?: string | null;
  contactId?: string | null;
  subject: string;
  description?: string | null;
  type?: "ISSUE" | "MAINTENANCE_REQUEST" | "QUESTION" | "BUG" | "BILLING";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}) {
  const ticket = await prisma.supportTicket.create({
    data: {
      organizationId: params.organizationId,
      reporterId: params.userId || null,
      leadId: params.leadId || null,
      companyId: params.companyId || null,
      projectId: params.projectId || null,
      contactId: params.contactId || null,
      subject: params.subject,
      description: params.description || null,
      type: params.type || "ISSUE",
      priority: params.priority || "MEDIUM"
    }
  });

  await prisma.activity.create({
    data: {
      organizationId: params.organizationId,
      actorId: params.userId || null,
      leadId: params.leadId || null,
      companyId: params.companyId || null,
      projectId: params.projectId || null,
      type: "TICKET_CREATED",
      title: `Ticket created: ${ticket.subject}`,
      body: ticket.description || null,
      metadata: toJsonValue({ ticketId: ticket.id, type: ticket.type, priority: ticket.priority })
    }
  });

  await createNotification({
    organizationId: params.organizationId,
    userId: params.userId || null,
    type: "TICKET_CREATED",
    title: `Ticket created: ${ticket.subject}`,
    body: ticket.description || "",
    metadata: { ticketId: ticket.id, type: ticket.type, priority: ticket.priority }
  });

  await triggerWorkflowEvent({
    organizationId: params.organizationId,
    actorId: params.userId || null,
    eventType: "TICKET_CREATED",
    payload: {
      ticketId: ticket.id,
      subject: ticket.subject,
      type: ticket.type,
      priority: ticket.priority,
      projectId: params.projectId || null,
      companyId: params.companyId || null
    }
  });

  return ticket;
}

export async function getExecutiveMetrics(organizationId: string) {
  const revenue = await getRevenueMetrics(organizationId);
  const [aiConversations, automationExecutions, openTickets, delayedProjects] = await Promise.all([
    prisma.conversation.count({ where: { organizationId } }),
    prisma.workflowRun.count({ where: { organizationId } }),
    prisma.supportTicket.count({ where: { organizationId, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CLIENT"] } } }),
    prisma.project.count({ where: { organizationId, deliveryStage: { in: ["DEVELOPMENT", "TESTING"] }, status: "ACTIVE" } })
  ]);

  return {
    monthlyRevenue: revenue.totalPaid,
    pipelineValue: revenue.pipelineValue,
    activeClients: revenue.activeClients,
    activeProjects: revenue.activeProjects,
    pendingPayments: revenue.pendingPayments,
    teamWorkload: revenue.activeProjects + openTickets,
    aiConversations,
    automationExecutions,
    growthMetrics: {
      invoices: revenue.invoices.length,
      payments: revenue.payments.length,
      expenses: revenue.expenses.length
    },
    delayedProjects,
    openTickets,
    revenue
  };
}

export async function answerBusinessQuestion(params: {
  organizationId: string;
  userId?: string | null;
  question: string;
}) {
  const lower = params.question.toLowerCase();
  const metrics = await getExecutiveMetrics(params.organizationId);

  if (lower.includes("how many leads")) {
    const count = await prisma.lead.count({ where: { organizationId: params.organizationId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } });
    return { answer: `There were ${count} new leads in the last 7 days.`, metrics };
  }

  if (lower.includes("which clients need follow-up")) {
    const leads = await prisma.lead.findMany({
      where: {
        organizationId: params.organizationId,
        status: { in: ["NEW", "CONTACTED", "ENGAGED"] },
        archivedAt: null
      },
      orderBy: [{ lastActivityAt: "asc" }, { updatedAt: "asc" }],
      take: 10,
      include: { company: true, owner: true }
    });
    return {
      answer: leads.length
        ? `These clients need follow-up: ${leads

        .map((lead: { companyName: string | null; fullName: string | null; company?: { name: string } | null; id: string }) =>
          lead.companyName || lead.fullName || lead.company?.name || lead.id
        )
        .join(", ")}.`
        : "No active follow-up clients need attention right now.",
      metrics,
      leads
    };
  }

if (lower.includes("which projects are delayed")) {
    const projects = await prisma.project.findMany({
      where: {
        organizationId: params.organizationId,
        status: "ACTIVE",
        OR: [
          { deliveryStage: "DEVELOPMENT" },
          { deliveryStage: "TESTING" }
        ]
      },
      orderBy: { updatedAt: "asc" },
      include: { company: true, lead: true, milestones: true, tasks: true }
    });
    return {
      answer: projects.length
? `Projects to review: ${projects
        .map((project: { name: string }) => project.name)
        .join(", ")}.`
        : "No delayed projects are currently detected.",
      metrics,
      projects
    };
  }

  if (lower.includes("show revenue") || lower.includes("revenue")) {
    return {
      answer: `Revenue is ${metrics.revenue.totalPaid} paid, ${metrics.revenue.totalExpenses} expenses, and ${metrics.revenue.pendingPayments} pending invoices.`,
      metrics
    };
  }

  if (lower.includes("business health") || lower.includes("health")) {
    return {
      answer:
        `Business health: ${metrics.activeClients} active clients, ${metrics.activeProjects} active projects, ${metrics.pendingPayments} pending payments, and ${metrics.openTickets} open tickets.`,
      metrics
    };
  }

  return null;
}
