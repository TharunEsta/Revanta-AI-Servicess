import { prisma } from "@/lib/revanta-os/db";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { getWhatsAppMetrics } from "@/lib/revanta-os/whatsapp";
import { Card } from "@/components/ui";

export default async function WhatsAppPage() {
  const session = await getSessionUser();
  if (!session?.orgId) return null;

  const metrics = await getWhatsAppMetrics(session.orgId);
  const templates = await prisma.whatsAppTemplate.findMany({
    where: { organizationId: session.orgId },
    orderBy: { updatedAt: "desc" },
    take: 6
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">WhatsApp Command Center</p>
        <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          Messaging, status tracking, and automation
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Conversations", value: metrics.conversations },
          { label: "Messages", value: metrics.messages },
          { label: "Delivered", value: metrics.delivered },
          { label: "Read", value: metrics.read },
          { label: "Failed", value: metrics.failed },
          { label: "Templates", value: metrics.templates }
        ].map((item) => (
          <Card key={item.label} className="bg-white">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
            <p className="mt-4 font-[var(--font-display)] text-4xl font-semibold tracking-[-0.06em] text-slate-950">
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Integration</p>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p>Phone number: {metrics.integration?.displayPhoneNumber || metrics.integration?.phoneNumberId || "Not configured"}</p>
            <p>Business account: {metrics.integration?.businessAccountId || "Not configured"}</p>
            <p>Default assignee: {metrics.integration?.defaultAssignee?.name || metrics.integration?.defaultAssignee?.email || "Unassigned"}</p>
            <p>Auto-create leads: {metrics.integration?.autoCreateLeads ? "Enabled" : "Disabled"}</p>
            <p>Auto-create contacts: {metrics.integration?.autoCreateContacts ? "Enabled" : "Disabled"}</p>
          </div>
        </Card>

        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Templates</p>
          <div className="mt-4 space-y-3">
            {templates.map((template: { id: string; name: string; language: string; status: string; category: string | null; } ) => (

              <div key={template.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

                <p className="font-medium text-slate-950">{template.name}</p>
                <p className="text-sm text-slate-600">
                  {template.language} · {template.status}
                  {template.category ? ` · ${template.category}` : ""}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="bg-white">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Recent WhatsApp messages</p>
        <div className="mt-4 space-y-3">
            {metrics.recentMessages.map((message: any) => (


            <div key={message.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="font-medium text-slate-950">
                {message.conversation.subject || message.conversation.lead?.companyName || message.conversation.lead?.fullName || "Conversation"}
              </p>
              <p className="text-sm text-slate-600">
                {message.direction} · {message.status || "unknown"}
                {message.conversation.assignedTo?.name ? ` · ${message.conversation.assignedTo.name}` : ""}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-700">{message.body}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
