import { prisma } from "@/lib/revanta-os/db";
import { runAIPrompt } from "@/lib/revanta-os/ai";
import { triggerWorkflowEvent } from "@/lib/revanta-os/workflows";
import { toJsonValue } from "@/lib/revanta-os/json";

export type ServiceCatalogSection = {
  category: string;
  services: Array<{
    name: string;
    slug: string;
    description: string;
    deliverables: string[];
  }>;
};

export const SERVICE_CATALOG: ServiceCatalogSection[] = [
  {
    category: "AI Solutions",
    services: [
      {
        name: "AI Agents",
        slug: "ai-agents",
        description: "Task-specific AI agents for support, sales, and operations.",
        deliverables: ["Agent design", "Prompt orchestration", "Operational handoff"]
      },
      {
        name: "Voice AI",
        slug: "voice-ai",
        description: "Voice assistants for inbound and outbound business calls.",
        deliverables: ["Call flows", "Lead qualification", "Escalation logic"]
      },
      {
        name: "Customer Support AI",
        slug: "customer-support-ai",
        description: "Support assistants that resolve common customer questions.",
        deliverables: ["Knowledge-aware replies", "Ticket routing", "Support playbooks"]
      },
      {
        name: "Knowledge Base AI",
        slug: "knowledge-base-ai-service",
        description: "Searchable company knowledge that powers response generation.",
        deliverables: ["Document ingestion", "Retrieval", "Answer synthesis"]
      },
      {
        name: "Automation Systems",
        slug: "automation-systems",
        description: "Connected automation around sales, support, and delivery.",
        deliverables: ["Workflow mapping", "Integration design", "Execution monitoring"]
      }
    ]
  },
  {
    category: "Software",
    services: [
      { name: "SaaS Applications", slug: "saas-applications", description: "Custom SaaS products built around a clear business model.", deliverables: ["Product scope", "Architecture", "Launch plan"] },
      { name: "CRM Systems", slug: "crm-systems", description: "Lead, deal, and customer systems that fit real workflows.", deliverables: ["Pipeline design", "Automation", "Reporting"] },
      { name: "ERP Systems", slug: "erp-systems", description: "Operations platforms for connected business management.", deliverables: ["Process design", "Modules", "Role controls"] },
      { name: "Web Applications", slug: "web-applications", description: "Modern web apps for internal teams and customer experiences.", deliverables: ["UI/UX", "Backend", "Deployment"] },
      { name: "Mobile Applications", slug: "mobile-applications", description: "Mobile products for customer or field team use.", deliverables: ["App flow", "Build", "Release support"] }
    ]
  },
  {
    category: "Web",
    services: [
      { name: "Websites", slug: "websites", description: "High-trust marketing websites with strong buying paths.", deliverables: ["Messaging", "Design", "Conversion flow"] },
      { name: "E-Commerce", slug: "e-commerce", description: "Stores designed for product sales and conversion.", deliverables: ["Catalog structure", "Checkout", "Tracking"] },
      { name: "Landing Pages", slug: "landing-pages", description: "Campaign pages focused on lead generation and testing.", deliverables: ["Offer framing", "Page design", "Lead capture"] },
      { name: "3D Websites", slug: "3d-websites", description: "Interactive websites with immersive visual experiences.", deliverables: ["3D concept", "Implementation", "Performance tuning"] }
    ]
  },
  {
    category: "Automation",
    services: [
      { name: "WhatsApp Automation", slug: "whatsapp-automation", description: "Automated WhatsApp conversations and follow-up systems.", deliverables: ["Webhook handling", "Templates", "Routing"] },
      { name: "N8N Workflows", slug: "n8n-workflows", description: "Workflow automation connected to N8N execution.", deliverables: ["Trigger design", "Error handling", "Monitoring"] },
      { name: "Business Process Automation", slug: "business-process-automation", description: "Workflow improvements across operations and service delivery.", deliverables: ["Process mapping", "Automation", "Handover"] }
    ]
  },
  {
    category: "Advanced",
    services: [
      { name: "Hologram Solutions", slug: "hologram-solutions", description: "Experimental presentation and engagement systems.", deliverables: ["Experience design", "Technical integration", "Launch support"] },
      { name: "IoT Systems", slug: "iot-systems", description: "Connected systems bridging software and physical devices.", deliverables: ["Device mapping", "Data flow", "Monitoring"] },
      { name: "Interactive Experiences", slug: "interactive-experiences", description: "Engagement-focused digital installations and interfaces.", deliverables: ["Interaction design", "Implementation", "Optimization"] }
    ]
  }
];

type ProjectPlan = {
  requirementSummary: string;
  complexityScore: number;
  estimatedHours: number;
  deliveryStage: string;
  proposalSummary: Record<string, unknown>;
  aiPlan: Record<string, unknown>;
  blockers: string[];
  milestones: Array<{
    title: string;
    description: string;
    dueInDays: number;
  }>;
  tasks: Array<{
    title: string;
    description: string;
    priority: number;
  }>;
  versionHistory: Array<{
    version: string;
    summary: string;
  }>;
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const PROJECT_DELIVERY_STAGES = new Set([
  "DISCOVERY",
  "REQUIREMENTS",
  "DESIGN",
  "DEVELOPMENT",
  "TESTING",
  "DEPLOYMENT",
  "MAINTENANCE"
]);

function inferServiceType(input: string) {
  const value = input.toLowerCase();
  if (value.includes("whatsapp")) return "WhatsApp Automation";
  if (value.includes("voice")) return "Voice AI";
  if (value.includes("crm")) return "CRM Systems";
  if (value.includes("saas")) return "SaaS Applications";
  if (value.includes("app")) return "Web Applications";
  if (value.includes("website") || value.includes("landing")) return "Websites";
  if (value.includes("automation") || value.includes("n8n")) return "Business Process Automation";
  if (value.includes("support") || value.includes("helpdesk")) return "Customer Support AI";
  return "Automation Systems";
}

function fallbackProjectPlan(input: {
  projectName: string;
  requirements: string;
  serviceType: string;
  companyName?: string | null;
}) {
  const requirementWords = input.requirements.split(/\s+/).filter(Boolean).length;
  const complexityScore = Math.max(25, Math.min(95, 30 + Math.round(requirementWords / 12)));
  const estimatedHours = Math.max(24, Math.round(complexityScore * 2.4));
  const blockerHints = [
    input.requirements.toLowerCase().includes("integration") ? "External integrations may need credentials and test access." : null,
    input.requirements.toLowerCase().includes("approval") ? "Client approval cycles can extend milestone dates." : null
  ].filter(Boolean) as string[];

  return {
    requirementSummary: input.requirements || `${input.serviceType} delivery for ${input.companyName || input.projectName}.`,
    complexityScore,
    estimatedHours,
    deliveryStage: complexityScore > 75 ? "REQUIREMENTS" : "DISCOVERY",
    proposalSummary: {
      requirementSummary: input.requirements || "",
      technicalApproach:
        "Build the solution with a scoped delivery plan, milestone gates, clear acceptance criteria, and automation where relevant.",
      timeline: complexityScore > 75 ? "4-8 weeks" : "2-4 weeks",
      deliverables: ["Discovery plan", "Implementation", "Testing", "Deployment", "Handover"]
    } as Record<string, unknown>,
    aiPlan: {
      serviceType: input.serviceType,
      complexityScore,
      estimatedHours,
      suggestedStages: ["Discovery", "Requirements", "Design", "Development", "Testing", "Deployment", "Maintenance"]
    } as Record<string, unknown>,
    blockers: blockerHints.length > 0 ? blockerHints : ["Scope clarity may need a short discovery pass."],
    milestones: [
      { title: "Discovery and scoping", description: "Confirm goals, stakeholders, and success criteria.", dueInDays: 3 },
      { title: "Build and validation", description: "Implement the requested solution and verify critical flows.", dueInDays: 14 },
      { title: "Launch and handover", description: "Deploy, document, and hand over the completed work.", dueInDays: 24 }
    ],
    tasks: [
      { title: "Capture requirements", description: "Document scope, dependencies, and acceptance criteria.", priority: 1 },
      { title: "Design implementation plan", description: "Translate requirements into build stages and assignments.", priority: 2 },
      { title: "Deliver core build", description: "Implement the primary product or automation flow.", priority: 2 },
      { title: "Test and deploy", description: "Validate the delivery and prepare the release path.", priority: 1 }
    ],
    versionHistory: [{ version: "v1", summary: "Initial project plan generated from deal requirements." }]
  } satisfies ProjectPlan;
}

function normalizeProjectDeliveryStage(value: string | null | undefined) {
  if (!value) return "DISCOVERY";
  const normalized = value.toUpperCase();
  return PROJECT_DELIVERY_STAGES.has(normalized) ? normalized : "DISCOVERY";
}

async function buildAProjectPlan(params: {
  organizationId: string;
  userId?: string | null;
  projectName: string;
  serviceType: string;
  requirements: string;
  companyName?: string | null;
  leadName?: string | null;
}) {
  try {
    const result = await runAIPrompt({
      organizationId: params.organizationId,
      userId: params.userId || null,
      purpose: "chat",
      prompt: JSON.stringify({
        projectName: params.projectName,
        serviceType: params.serviceType,
        requirements: params.requirements,
        companyName: params.companyName,
        leadName: params.leadName
      }),
      parseJson: true,
      system:
        "You are Revanta AI's project manager. Return JSON with requirementSummary, complexityScore, estimatedHours, deliveryStage, proposalSummary, aiPlan, blockers, milestones, tasks, and versionHistory. Keep the plan operational and specific."
    });

    const parsed = (result.parsed || {}) as Record<string, unknown>;
    const milestones = Array.isArray(parsed.milestones) ? (parsed.milestones as ProjectPlan["milestones"]) : [];
    const tasks = Array.isArray(parsed.tasks) ? (parsed.tasks as ProjectPlan["tasks"]) : [];
    const blockers = Array.isArray(parsed.blockers) ? (parsed.blockers as string[]) : [];
    const versionHistory = Array.isArray(parsed.versionHistory) ? (parsed.versionHistory as ProjectPlan["versionHistory"]) : [];
    const fallbackPlan = fallbackProjectPlan(params);
    const proposalSummary =
      parsed.proposalSummary && typeof parsed.proposalSummary === "object" && !Array.isArray(parsed.proposalSummary)
        ? (parsed.proposalSummary as Record<string, unknown>)
        : fallbackPlan.proposalSummary;
    const aiPlan =
      parsed.aiPlan && typeof parsed.aiPlan === "object" && !Array.isArray(parsed.aiPlan)
        ? (parsed.aiPlan as Record<string, unknown>)
        : fallbackPlan.aiPlan;

    return {
      requirementSummary:
        typeof parsed.requirementSummary === "string" ? parsed.requirementSummary : params.requirements,
      complexityScore:
        typeof parsed.complexityScore === "number" ? parsed.complexityScore : fallbackPlan.complexityScore,
      estimatedHours:
        typeof parsed.estimatedHours === "number" ? parsed.estimatedHours : fallbackPlan.estimatedHours,
      deliveryStage:
        typeof parsed.deliveryStage === "string" ? parsed.deliveryStage : fallbackPlan.deliveryStage,
      proposalSummary,
      aiPlan,
      blockers: blockers.length > 0 ? blockers : fallbackPlan.blockers,
      milestones: milestones.length > 0 ? milestones : fallbackPlan.milestones,
      tasks: tasks.length > 0 ? tasks : fallbackPlan.tasks,
      versionHistory: versionHistory.length > 0 ? versionHistory : fallbackPlan.versionHistory
    } satisfies ProjectPlan;
  } catch {
    return fallbackProjectPlan(params);
  }
}

export async function ensureServiceCatalog(organizationId: string) {
  for (const section of SERVICE_CATALOG) {
    for (let index = 0; index < section.services.length; index += 1) {
      const service = section.services[index];
      await prisma.serviceCatalogItem.upsert({
        where: {
          organizationId_slug: {
            organizationId,
            slug: service.slug
          }
        },
        update: {
          category: section.category,
          name: service.name,
          description: service.description,
          deliverables: toJsonValue(service.deliverables),
          active: true,
          sortOrder: index,
          metadata: toJsonValue({ category: section.category, seed: true })
        },
        create: {
          organizationId,
          category: section.category,
          name: service.name,
          slug: service.slug,
          description: service.description,
          deliverables: toJsonValue(service.deliverables),
          active: true,
          sortOrder: index,
          metadata: toJsonValue({ category: section.category, seed: true })
        }
      });
    }
  }
}

export async function getServiceCatalog(organizationId: string) {
  await ensureServiceCatalog(organizationId);
  return prisma.serviceCatalogItem.findMany({
    where: { organizationId },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }]
  });
}

function matchCatalogItem(serviceCatalogItems: Awaited<ReturnType<typeof getServiceCatalog>>, serviceType: string | null) {
  if (!serviceType) return null;
  const normalized = normalizeText(serviceType);
  return (
    serviceCatalogItems.find((item: any) => normalizeText(item.slug) === normalized) ||
    serviceCatalogItems.find((item: any) => normalizeText(item.name) === normalized) ||
    serviceCatalogItems.find((item: any) =>
      normalizeText(item.name).includes(normalized) || normalized.includes(normalizeText(item.name))
    ) ||
    null
  );
}

export async function createProjectFromWonDeal(params: {
  organizationId: string;
  dealId: string;
  actorId?: string | null;
}) {
  const deal = await prisma.deal.findFirst({
    where: { id: params.dealId, organizationId: params.organizationId },
    include: {
      company: true,
      lead: { include: { company: true, contact: true } },
      owner: true,
      project: true
    }
  });

  if (!deal) {
    throw new Error("Deal not found");
  }

  if (deal.project) {
    return deal.project;
  }

  await ensureServiceCatalog(params.organizationId);
  const catalog = await getServiceCatalog(params.organizationId);

  // Cast to avoid implicit-any errors in nested callbacks.
  const serviceType =
    deal.serviceType ||
    deal.lead?.serviceType ||
    inferServiceType(`${deal.title} ${deal.notes || ""} ${deal.lead?.notes || ""} ${deal.company?.notes || ""}`);
  const catalogItem = matchCatalogItem(catalog, serviceType);
  const projectName = deal.title || deal.company?.name || deal.lead?.companyName || "Client project";
  const requirements = [deal.notes, deal.lead?.notes, deal.company?.notes].filter(Boolean).join("\n\n");
  const plan = await buildAProjectPlan({
    organizationId: params.organizationId,
    userId: params.actorId || deal.ownerId || null,
    projectName,
    serviceType,
    requirements,
    companyName: deal.company?.name || deal.lead?.companyName || null,
    leadName: deal.lead?.fullName || null
  });

  const project = await prisma.project.create({
    data: {
      organizationId: params.organizationId,
      dealId: deal.id,
      ownerId: deal.ownerId || null,
      leadId: deal.leadId || null,
      companyId: deal.companyId || deal.lead?.companyId || null,
    serviceCatalogItemId: catalogItem?.id || null,

      name: projectName,
      serviceType,
      status: "ACTIVE",
      deliveryStage: normalizeProjectDeliveryStage(plan.deliveryStage) as any,
      summary: plan.requirementSummary,
      requirements: requirements || null,
      requirementsSummary: plan.requirementSummary,
      aiPlan: toJsonValue(plan.aiPlan),
      complexityScore: plan.complexityScore,
      estimatedHours: plan.estimatedHours,
      proposalSummary: toJsonValue(plan.proposalSummary),
      blockers: toJsonValue(plan.blockers),
      versionHistory: toJsonValue(plan.versionHistory),
      clientSatisfaction: null,
      environmentStatus: "PLANNED"
    }
  });

  const createdMilestones: Array<{ id: string; title: string }> = [];
  for (let index = 0; index < plan.milestones.length; index += 1) {
    const milestonePlan = plan.milestones[index];
    const milestone = await prisma.projectMilestone.create({
      data: {
        organizationId: params.organizationId,
        projectId: project.id,
        title: milestonePlan.title,
        description: milestonePlan.description,
        status: "PLANNED",
        sortOrder: index,
        dueAt: new Date(Date.now() + milestonePlan.dueInDays * 24 * 60 * 60 * 1000)
      }
    });
    createdMilestones.push({ id: milestone.id, title: milestone.title });
  }

  const firstMilestoneId = createdMilestones[0]?.id || null;
  for (let index = 0; index < plan.tasks.length; index += 1) {
    const taskPlan = plan.tasks[index];
    await prisma.task.create({
      data: {
        organizationId: params.organizationId,
        projectId: project.id,
        milestoneId: firstMilestoneId,
        creatorId: params.actorId || deal.ownerId || null,
        assigneeId: deal.ownerId || params.actorId || null,
        title: taskPlan.title,
        description: taskPlan.description,
        priority: taskPlan.priority,
        status: index === 0 ? "IN_PROGRESS" : "OPEN"
      }
    });
  }

  await prisma.projectMember.create({
    data: {
      organizationId: params.organizationId,
      projectId: project.id,
      userId: deal.ownerId || params.actorId || null,
      role: "Owner",
      allocationPct: 100
    }
  });

  await prisma.conversation.create({
    data: {
      organizationId: params.organizationId,
      projectId: project.id,
      companyId: project.companyId || null,
      leadId: project.leadId || null,
      assignedToId: deal.ownerId || params.actorId || null,
      channel: "WEB",
      status: "OPEN",
      subject: `${project.name} delivery thread`,
      startedAt: new Date(),
      lastMessageAt: new Date(),
      metadata: toJsonValue({ source: "project-portal", dealId: deal.id })
    }
  });

  await prisma.activity.create({
    data: {
      organizationId: params.organizationId,
      actorId: params.actorId || deal.ownerId || null,
      dealId: deal.id,
      projectId: project.id,
      type: "PROJECT_CREATED",
      title: `Project created for ${deal.title}`,
      body: `Project ${project.name} created automatically from won deal.`,
      metadata: toJsonValue({
        dealId: deal.id,
        projectId: project.id,
        serviceType
      })
    }
  });

  await triggerWorkflowEvent({
    organizationId: params.organizationId,
    actorId: params.actorId || deal.ownerId || null,
    eventType: "PROJECT_CREATED",
    payload: {
      dealId: deal.id,
      projectId: project.id,
      serviceType,
      projectName: project.name
    }
  });

  return prisma.project.findUnique({
    where: { id: project.id },
    include: {
      deal: true,
      owner: true,
      lead: true,
      company: true,
      serviceCatalogItem: true,
      tasks: { include: { assignee: true, creator: true, milestone: true }, orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 25 },
      conversations: { include: { messages: { orderBy: { createdAt: "desc" }, take: 10 } }, orderBy: { updatedAt: "desc" } },
      members: { include: { user: true } },
      milestones: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { createdAt: "desc" } }
    }
  });
}

export async function getProjectDashboardStats(organizationId: string) {
  const [activeProjects, pendingTasks, upcomingDeadlines, clientSatisfaction] = await Promise.all([
    prisma.project.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.task.count({ where: { organizationId, status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } } }),
    prisma.projectMilestone.count({
      where: {
        organizationId,
        status: { notIn: ["DONE", "APPROVED"] },
        dueAt: { gte: new Date(), lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }
      }
    }),
    prisma.project.aggregate({
      where: { organizationId, clientSatisfaction: { not: null } },
      _avg: { clientSatisfaction: true }
    })
  ]);

  const projects = await prisma.project.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: {
      company: true,
      lead: true,
      owner: true,
      serviceCatalogItem: true,
      milestones: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 4 },
      tasks: { orderBy: { createdAt: "desc" }, take: 4, include: { assignee: true } },
      conversations: { orderBy: { updatedAt: "desc" }, take: 1, include: { messages: { orderBy: { createdAt: "desc" }, take: 3 } } }
    }
  });

  return {
    activeProjects,
    pendingTasks,
    upcomingDeadlines,
    clientSatisfaction: clientSatisfaction._avg.clientSatisfaction ? Math.round(clientSatisfaction._avg.clientSatisfaction) : 0,
    deliveryHealth:
      upcomingDeadlines > 0 || pendingTasks > activeProjects * 4
        ? "At risk"
        : pendingTasks > activeProjects * 2
          ? "Watch"
          : "Healthy",
    projects
  };
}
