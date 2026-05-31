import Link from "next/link";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { getDashboardSummary } from "@/lib/revanta-os/dashboard";
import { prisma } from "@/lib/revanta-os/db";
import { Card } from "@/components/ui";

export default async function DashboardHomePage() {
  const session = await getSessionUser();
  if (!session?.orgId) {
    return null;
  }

  const summary = await getDashboardSummary(session.orgId);
  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });

  const widgets = [
    { label: "Revenue", value: "See billing" },
    { label: "Leads", value: summary.counts.leadCount },
    { label: "Conversations", value: summary.counts.conversationCount },
    { label: "Tasks", value: summary.counts.taskCount },
    { label: "AI Activity", value: summary.counts.aiActivityCount },
    { label: "WhatsApp", value: summary.counts.whatsappCount },
    { label: "Workflows", value: summary.counts.workflowRunCount },
    { label: "Templates", value: summary.counts.whatsappTemplateCount },
    { label: "Knowledge", value: summary.counts.documentCount },
    { label: "Company Brain", value: summary.counts.companyKnowledgeCount },
    { label: "Human takeover", value: summary.counts.humanActiveConversationCount },
    { label: "Qualified leads", value: summary.counts.qualifiedLeadCount },
    { label: "Active projects", value: summary.counts.activeProjectCount },
    { label: "Project tasks", value: summary.counts.pendingProjectTaskCount },
    { label: "Deadlines", value: summary.counts.upcomingProjectDeadlineCount }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Organizations Dashboard</p>
        <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          {org?.name || "Revanta OS"}
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

      <Card className="bg-white">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Recent projects</p>
        <div className="mt-4 space-y-3">
          {summary.recentProjects.map((project) => (
            <div key={project.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="font-medium text-slate-950">{project.name}</p>
              <p className="text-sm text-slate-600">
                {project.company?.name || project.lead?.companyName || "No client"} · {project.deliveryStage} · {project.status}
              </p>
            </div>
          ))}
        </div>
        <Link href="/dashboard/projects" className="button-secondary mt-5 w-fit">
          Open Projects
        </Link>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Latest leads</p>
          <div className="mt-4 space-y-3">
            {summary.latestLeads.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{lead.companyName || lead.fullName || "Untitled lead"}</p>
                <p className="text-sm text-slate-600">{lead.status} · {lead.source}</p>
              </div>
            ))}
          </div>
          <Link href="/dashboard/leads" className="button-secondary mt-5 w-fit">
            Open Leads
          </Link>
        </Card>

        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Recent activity</p>
          <div className="mt-4 space-y-3">
            {summary.recentActivities.map((activity) => (
              <div key={activity.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{activity.title}</p>
                <p className="text-sm text-slate-600">{activity.type}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Latest conversations</p>
          <div className="mt-4 space-y-3">
            {summary.latestConversations.map((conversation) => (
              <div key={conversation.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{conversation.subject || conversation.lead?.companyName || conversation.lead?.fullName || "Conversation"}</p>
                <p className="text-sm text-slate-600">
                  {conversation.channel} · {conversation.status}
                  {conversation.assignedTo?.name ? ` · ${conversation.assignedTo.name}` : ""}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Recent workflow runs</p>
          <div className="mt-4 space-y-3">
            {summary.recentWorkflowRuns.map((run) => (
              <div key={run.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{run.workflow.name}</p>
                <p className="text-sm text-slate-600">{run.status} · {run.trigger || "manual"}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
