import { getSessionUser } from "@/lib/revanta-os/auth";
import { getExecutiveMetrics } from "@/lib/revanta-os/business";
import { prisma } from "@/lib/revanta-os/db";
import { Card } from "@/components/ui";

export default async function CeoDashboardPage() {
  const session = await getSessionUser();
  if (!session?.orgId) return null;

  const metrics = await getExecutiveMetrics(session.orgId);
  const [projects, tickets, proposals] = await Promise.all([
    prisma.project.findMany({ where: { organizationId: session.orgId }, include: { company: true, lead: true }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.supportTicket.findMany({ where: { organizationId: session.orgId }, include: { assignee: true, reporter: true }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.proposal.findMany({ where: { organizationId: session.orgId }, include: { lead: true, company: true }, orderBy: { updatedAt: "desc" }, take: 5 })
  ]);

  const widgets = [
    { label: "Monthly revenue", value: metrics.monthlyRevenue },
    { label: "Pipeline value", value: metrics.pipelineValue },
    { label: "Active clients", value: metrics.activeClients },
    { label: "Active projects", value: metrics.activeProjects },
    { label: "Pending payments", value: metrics.pendingPayments },
    { label: "Team workload", value: metrics.teamWorkload },
    { label: "AI conversations", value: metrics.aiConversations },
    { label: "Automation runs", value: metrics.automationExecutions },
    { label: "Delayed projects", value: metrics.delayedProjects },
    { label: "Open tickets", value: metrics.openTickets }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">CEO Dashboard</p>
        <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          Executive intelligence
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {widgets.map((widget) => (
          <Card key={widget.label} className="bg-white">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{widget.label}</p>
            <p className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
              {typeof widget.value === "number" ? widget.value : `${widget.value}`}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Projects</p>
          <div className="mt-4 space-y-3">
            {projects.map((project) => (
              <div key={project.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{project.name}</p>
                <p className="text-sm text-slate-600">{project.company?.name || project.lead?.companyName || "No client"} · {project.deliveryStage}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Support</p>
          <div className="mt-4 space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{ticket.subject}</p>
                <p className="text-sm text-slate-600">{ticket.status} · {ticket.priority}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Proposals</p>
          <div className="mt-4 space-y-3">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{proposal.title}</p>
                <p className="text-sm text-slate-600">{proposal.status} · {proposal.approvalStatus || "PENDING"}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
