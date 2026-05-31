import { prisma } from "@/lib/revanta-os/db";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { RevOpsLeadsTable } from "@/components/revops/RevOpsLeadsTable";

export default async function LeadsPage() {
  const session = await getSessionUser();
  if (!session?.orgId) return null;
  const database = prisma as any;

  const [leads, owners] = (await Promise.all([
    database.lead.findMany({
      where: { organizationId: session.orgId, archivedAt: null },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            email: true,
            phone: true,
            linkedinUrl: true
          }
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            type: true,
            title: true,
            body: true,
            createdAt: true
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 100
    }),
    database.user.findMany({
      where: {
        memberships: {
          some: {
            organizationId: session.orgId,
            status: "ACTIVE"
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: { name: "asc" }
    })
  ])) as [any[], any[]];

  const initialLeads = leads.map((lead: any) => ({
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    lastActivityAt: lead.lastActivityAt ? lead.lastActivityAt.toISOString() : null,
    archivedAt: lead.archivedAt ? lead.archivedAt.toISOString() : null,
    activities: lead.activities.map((activity: any) => ({
      ...activity,
      createdAt: activity.createdAt.toISOString()
    }))
  }));

  return <RevOpsLeadsTable initialLeads={initialLeads} initialOwners={owners} />;
}
