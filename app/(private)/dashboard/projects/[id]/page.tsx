 import { prisma } from "@/lib/revanta-os/db";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { Card } from "@/components/ui";
import { ProjectDeliveryManager } from "@/components/project-delivery-manager";

const DELIVERY_STAGES = ["DISCOVERY", "REQUIREMENTS", "DESIGN", "DEVELOPMENT", "TESTING", "DEPLOYMENT", "MAINTENANCE"];

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session?.orgId) return null;
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.orgId },
    include: {
      deal: true,
      owner: true,
      lead: true,
      company: true,
      serviceCatalogItem: true,
      tasks: { include: { assignee: true, creator: true, milestone: true }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] },
      milestones: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
      conversations: { include: { messages: { orderBy: { createdAt: "asc" } } }, orderBy: { updatedAt: "desc" } },
      attachments: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 50 }
    }
  });

  if (!project) return null;

  const latestConversation = project.conversations[0];
const activeTasks = project.tasks.filter((task: { status: string }) => !["COMPLETED", "CANCELED"].includes(task.status));
  const openMilestones = project.milestones.filter((milestone: { status: string }) => !["APPROVED", "DONE"].includes(milestone.status));



  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">Delivery</p>
          <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
            {project.name}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {project.company?.name || project.lead?.companyName || project.lead?.fullName || "No client assigned"}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {project.serviceType || project.serviceCatalogItem?.name || "Service not set"} · {project.status} · {project.deliveryStage}
          </p>
        </div>
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Project health</p>
          <p className="mt-4 font-[var(--font-display)] text-4xl font-semibold tracking-[-0.06em] text-slate-950">
            {project.clientSatisfaction ?? "—"}
          </p>
          <p className="mt-2 text-sm text-slate-600">{project.environmentStatus || "Environment not set"}</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Open tasks", value: activeTasks.length },
          { label: "Open milestones", value: openMilestones.length },
          { label: "Docs", value: project.attachments.length + project.documents.length },
          { label: "Stage", value: project.deliveryStage }
        ].map((widget) => (
          <Card key={widget.label} className="bg-white">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{widget.label}</p>
            <p className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
              {widget.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Proposal summary</p>
          <pre className="mt-4 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {JSON.stringify(project.proposalSummary || project.aiPlan || {}, null, 2)}
          </pre>
        </Card>
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Blockers</p>
          <pre className="mt-4 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {JSON.stringify(project.blockers || [], null, 2)}
          </pre>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Milestones</p>
          <div className="mt-4 space-y-3">
            {project.milestones.map((milestone: { id: string; title: string; status: string; dueAt: Date | null }) => (
              <div key={milestone.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{milestone.title}</p>
                <p className="text-sm text-slate-600">{milestone.status} · {milestone.dueAt ? new Date(milestone.dueAt).toLocaleDateString() : "No due date"}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Tasks</p>
          <div className="mt-4 space-y-3">
            {project.tasks.map((task: { id: string; title: string; status: string; assignee: { name: string | null } | null }) => (
              <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{task.title}</p>
                <p className="text-sm text-slate-600">{task.status} · {task.assignee?.name || "Unassigned"}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Client thread</p>
          <div className="mt-4 space-y-3">
            {latestConversation?.messages?.length ? (
              latestConversation.messages.map((message: { id: string; direction: string; body: string }) => (
                <div key={message.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {message.direction} · {message.body}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">No client thread yet.</p>
            )}
          </div>
        </Card>

        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Pipeline</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {DELIVERY_STAGES.map((stage) => {
              const active = project.deliveryStage === stage;
              return (
                <div key={stage} className={`rounded-2xl border px-4 py-3 text-sm ${active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                  {stage}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="bg-white">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Activity timeline</p>
        <div className="mt-4 space-y-3">
          {project.activities.map((activity: { id: string; title: string; type: string }) => (
            <div key={activity.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="font-medium text-slate-950">{activity.title}</p>
              <p className="text-sm text-slate-600">{activity.type}</p>
            </div>
          ))}
        </div>
      </Card>

      <ProjectDeliveryManager project={project} />
    </div>
  );
}
