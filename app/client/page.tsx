import { getSessionUser } from "@/lib/revanta-os/auth";
import { prisma } from "@/lib/revanta-os/db";
import { Card } from "@/components/ui";
import { ProjectDeliveryManager } from "@/components/project-delivery-manager";

export default async function ClientPortalPage() {
  const session = await getSessionUser();
  if (!session?.orgId) return null;

  const projects = await prisma.project.findMany({
    where: { organizationId: session.orgId, status: { not: "CANCELED" } },
    include: {
      company: true,
      lead: true,
      owner: true,
      serviceCatalogItem: true,
      tasks: { include: { assignee: true, creator: true, milestone: true }, orderBy: { createdAt: "desc" } },
      milestones: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
      conversations: { include: { messages: { orderBy: { createdAt: "asc" } } }, orderBy: { updatedAt: "desc" } },
      attachments: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } }
    },
    orderBy: { updatedAt: "desc" },
    take: 8
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Client Portal</p>
        <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          Project progress
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          View active delivery work, share files, send messages, and approve milestones.
        </p>
      </div>

      <div className="grid gap-4">
        {projects.map((project: any) => ( 
          <Card key={project.id} className="bg-white">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  {project.serviceType || project.serviceCatalogItem?.name || "Project"}
                </p>
                <h3 className="mt-2 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {project.name}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {project.company?.name || project.lead?.companyName || "Client project"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p>{project.status}</p>
                <p>{project.deliveryStage}</p>
              </div>
            </div>
            <div className="mt-5">
              <ProjectDeliveryManager project={project} clientMode />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
