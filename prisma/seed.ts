import { hashPassword } from "../lib/revanta-os/auth";
import { prisma } from "../lib/revanta-os/db";
import { ensureServiceCatalog } from "../lib/revanta-os/projects";
import { workflowBlueprints } from "../content/revanta-os";
import { toJsonValue } from "../lib/revanta-os/json";

type SeedContext = {
  organizationId: string;
  ownerId: string;
};

function getSeedOrganization() {
  return {
    name: process.env.REVANTA_ORG_NAME || "Revanta OS",
    slug: process.env.REVANTA_ORG_SLUG || "revanta-os",
    domain: process.env.REVANTA_ORG_DOMAIN || null
  };
}

async function upsertOrganization() {
  const seedOrg = getSeedOrganization();
  return prisma.organization.upsert({
    where: { slug: seedOrg.slug },
    update: {
      name: seedOrg.name,
      domain: seedOrg.domain ?? undefined,
      settings: toJsonValue({
        ...(process.env.REVANTA_ORG_TIMEZONE ? { timezone: process.env.REVANTA_ORG_TIMEZONE } : {}),
        seeded: true
      })
    },
    create: {
      name: seedOrg.name,
      slug: seedOrg.slug,
      domain: seedOrg.domain ?? null,
      timezone: process.env.REVANTA_ORG_TIMEZONE || "Asia/Calcutta",
      settings: toJsonValue({ seeded: true })
    }
  });
}

async function upsertAdminUser() {
  const email =
    process.env.REVANTA_BOOTSTRAP_EMAIL ||
    (process.env.REVOPS_USERNAME ? `${process.env.REVOPS_USERNAME.toLowerCase()}@revanta.local` : "admin@revanta.local");
  const passwordHash = process.env.REVOPS_PASSWORD_HASH || (await hashPassword("change-me-now"));

  return prisma.user.upsert({
    where: { email },
    update: {
      name: process.env.REVANTA_BOOTSTRAP_NAME || "Revanta Admin",
      passwordHash,
      status: "ACTIVE"
    },
    create: {
      email,
      name: process.env.REVANTA_BOOTSTRAP_NAME || "Revanta Admin",
      passwordHash,
      status: "ACTIVE"
    }
  });
}

async function upsertOwnerRole(organizationId: string) {
  return prisma.role.upsert({
    where: {
      organizationId_name: {
        organizationId,
        name: "Owner"
      }
    },
    update: {
      scope: "ORG",
      description: "Organization owner with full access"
    },
    create: {
      organizationId,
      name: "Owner",
      scope: "ORG",
      description: "Organization owner with full access"
    }
  });
}

async function upsertMembership(params: { organizationId: string; userId: string; roleId: string }) {
  return prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: params.organizationId,
        userId: params.userId
      }
    },
    update: {
      roleId: params.roleId,
      status: "ACTIVE",
      title: "Owner"
    },
    create: {
      organizationId: params.organizationId,
      userId: params.userId,
      roleId: params.roleId,
      status: "ACTIVE",
      title: "Owner"
    }
  });
}

async function seedCompanyKnowledge(params: SeedContext) {
  const knowledgeEntries = [
    {
      category: "Company Information",
      title: "What Revanta OS is",
      content:
        "Revanta OS is the internal operating system for Revanta's sales, CRM, delivery, and WhatsApp automation workflows."
    },
    {
      category: "Services",
      title: "Core service catalog",
      content:
        "Revanta OS sells AI agents, websites, CRM systems, WhatsApp automation, N8N workflows, and delivery systems for service businesses."
    },
    {
      category: "Qualification Logic",
      title: "Lead handling rule",
      content:
        "New inbound leads should be acknowledged quickly, qualified with context, and routed toward the next useful action without delay."
    },
    {
      category: "Sales Scripts",
      title: "WhatsApp tone",
      content:
        "Keep replies concise, helpful, and confident. Ask one direct follow-up question when more context is needed."
    },
    {
      category: "Objection Handling",
      title: "Budget conversations",
      content:
        "When budget comes up, explain outcomes, scope, and phased delivery options instead of reacting defensively."
    }
  ];

  for (const [index, entry] of knowledgeEntries.entries()) {
    await prisma.companyKnowledge.upsert({
      where: {
        organizationId_category_title: {
          organizationId: params.organizationId,
          category: entry.category,
          title: entry.title
        }
      },
      update: {
        content: entry.content,
        status: "PUBLISHED",
        sortOrder: index,
        settings: toJsonValue({ seed: true })
      },
      create: {
        organizationId: params.organizationId,
        category: entry.category,
        title: entry.title,
        content: entry.content,
        status: "PUBLISHED",
        sortOrder: index,
        settings: toJsonValue({ seed: true })
      }
    });
  }
}

async function seedWorkflows(params: SeedContext) {
  for (const blueprint of workflowBlueprints) {
    const slug = blueprint.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    await prisma.workflow.upsert({
      where: {
        organizationId_slug: {
          organizationId: params.organizationId,
          slug
        }
      },
      update: {
        name: blueprint.title,
        description: blueprint.outcome,
        status: "ACTIVE",
        triggerType: blueprint.title === "Customer Message" ? "MESSAGE_RECEIVED" : "LEAD_CREATED",
        definition: toJsonValue({
          trigger: {
            event: blueprint.title === "Customer Message" ? "MESSAGE_RECEIVED" : "LEAD_CREATED"
          },
          steps: blueprint.steps,
          outcome: blueprint.outcome,
          seeded: true
        })
      },
      create: {
        organizationId: params.organizationId,
        ownerId: params.ownerId,
        name: blueprint.title,
        slug,
        description: blueprint.outcome,
        status: "ACTIVE",
        triggerType: blueprint.title === "Customer Message" ? "MESSAGE_RECEIVED" : "LEAD_CREATED",
        definition: toJsonValue({
          trigger: {
            event: blueprint.title === "Customer Message" ? "MESSAGE_RECEIVED" : "LEAD_CREATED"
          },
          steps: blueprint.steps,
          outcome: blueprint.outcome,
          seeded: true
        })
      }
    });
  }
}

async function seedWhatsAppIntegration(params: SeedContext) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || null;
  if (!phoneNumberId) {
    return;
  }

  await prisma.whatsAppIntegration.upsert({
    where: {
      organizationId: params.organizationId
    },
    update: {
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || null,
      phoneNumberId,
      displayPhoneNumber: process.env.WHATSAPP_DISPLAY_PHONE_NUMBER || null,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || null,
      defaultAssigneeId: params.ownerId,
      autoCreateLeads: true,
      autoCreateContacts: true,
      settings: toJsonValue({
        aiEnabled: true,
        autoReplyEnabled: true,
        humanTakeoverEnabled: true,
        seed: true
      })
    },
    create: {
      organizationId: params.organizationId,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || null,
      phoneNumberId,
      displayPhoneNumber: process.env.WHATSAPP_DISPLAY_PHONE_NUMBER || null,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || null,
      defaultAssigneeId: params.ownerId,
      autoCreateLeads: true,
      autoCreateContacts: true,
      settings: toJsonValue({
        aiEnabled: true,
        autoReplyEnabled: true,
        humanTakeoverEnabled: true,
        seed: true
      })
    }
  });
}

export default async function main() {
  const organization = await upsertOrganization();
  const adminUser = await upsertAdminUser();
  const ownerRole = await upsertOwnerRole(organization.id);

  await upsertMembership({
    organizationId: organization.id,
    userId: adminUser.id,
    roleId: ownerRole.id
  });

  await ensureServiceCatalog(organization.id);
  await seedCompanyKnowledge({ organizationId: organization.id, ownerId: adminUser.id });
  await seedWorkflows({ organizationId: organization.id, ownerId: adminUser.id });
  await seedWhatsAppIntegration({ organizationId: organization.id, ownerId: adminUser.id });

  console.log(`Seeded Revanta OS for organization ${organization.slug}`);
}
