import Link from "next/link";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { getProjectDashboardStats } from "@/lib/revanta-os/projects";
import { Card } from "@/components/ui";

export default async function ProjectsPage() {
  const session = await getSessionUser();
  if (!session?.orgId) return null;

  const summary = await getProjectDashboardStats(session.orgId);
  const widgets = [
    { label: "Active projects", value: summary.activeProjects },
    { label: "Pending tasks", value: summary.pendingTasks },
    { label: "Delivery health", value: summary.deliveryHealth },
    { label: "Client satisfaction", value: summary.clientSatisfaction || "—" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Delivery OS</p>
        <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          Projects
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {widgets.map((widget) => (
          <Card key={widget.label} className="bg-white">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{widget.label}</p>
            <p className="mt-4 font-[var(--font-display)] text-4xl font-semibold tracking-[-0.06em] text-slate-950">
              {widget.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4">
        {summary.projects.map((project) => {
          const nextMilestone = project.milestones[0];
          const openTasks = project.tasks.filter((task) => !["COMPLETED", "CANCELED"].includes(task.status));
          return (
            <Card key={project.id} className="bg-white">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    {project.serviceType || project.serviceCatalogItem?.name || "Project"}
                  </p>
                  <h3 className="mt-2 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {project.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {project.company?.name || project.lead?.companyName || project.lead?.fullName || "No client assigned"}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {project.deliveryStage} · {project.status} · {project.environmentStatus || "PLANNED"}
                  </p>
                </div>
                <Link href={`/dashboard/projects/${project.id}`} className="button-secondary">
                  Open project
                </Link>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Next milestone</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">{nextMilestone?.title || "No milestones yet"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Open tasks</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">{openTasks.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Repository</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">{project.repositoryUrl || "Not linked"}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
