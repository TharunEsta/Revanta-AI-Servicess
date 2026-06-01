import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { getCustomer360Profile } from "@/lib/revanta-os/customers";

export default async function CustomerDetailPage({
  params
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const session = await getSessionUser();
  if (!session?.orgId) return null;

  const { id } = await params;
  const customer = await getCustomer360Profile(session.orgId, id);
  if (!customer.lead && !customer.contact && !customer.company) {
    notFound();
  }

  const displayName =
    customer.lead?.companyName ||
    customer.lead?.fullName ||
    customer.company?.name ||
    customer.contact?.fullName ||
    customer.contact?.email ||
    "Customer";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">Customer 360</p>
          <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
            {displayName}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {customer.lead?.status || "Lead"} · {customer.lead?.score ?? "No score"} ·{" "}
            {customer.lead?.industry || customer.company?.industry || "Industry not set"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {customer.company ? <Link href="/dashboard/companies" className="button-secondary">Company</Link> : null}
          {customer.lead ? <Link href="/dashboard/leads" className="button-secondary">Lead</Link> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Revenue", value: `$${customer.revenue.toFixed(2)}` },
          { label: "Open tasks", value: customer.openTasks.length },
          { label: "Opportunities", value: customer.openOpportunities.length },
          { label: "WhatsApp messages", value: customer.whatsappMessages.length }
        ].map((item) => (
          <Card key={item.label} className="bg-white">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
            <p className="mt-4 font-[var(--font-display)] text-4xl font-semibold tracking-[-0.06em] text-slate-950">
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Timeline</p>
          <div className="mt-4 space-y-3">
            {customer.timeline.map((item) => (
              <div key={`${item.kind}-${item.id}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{item.title}</p>
                <p className="text-sm text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">AI summary</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              {customer.aiSummary ? (
                <pre className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  {typeof customer.aiSummary === "string" ? customer.aiSummary : JSON.stringify(customer.aiSummary, null, 2)}
                </pre>
              ) : (
                <p>No AI summary stored yet.</p>
              )}
            </div>
          </Card>

          <Card className="bg-white">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Open tasks</p>
            <div className="mt-4 space-y-3">
              {customer.openTasks.map((task: typeof customer.openTasks[number]) => (
                <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-950">{task.title}</p>
                  <p className="text-sm text-slate-600">{task.status}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-white">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">WhatsApp history</p>
            <div className="mt-4 space-y-3">
              {customer.whatsappMessages.map((message: typeof customer.whatsappMessages[number]) => (
                <div key={message.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-950">{message.direction} · {message.status || "unknown"}</p>
                  <p className="text-sm text-slate-600">{message.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Interactions</p>
          <div className="mt-4 space-y-3">
            {customer.activities.map((activity: typeof customer.activities[number]) => (
              <div key={activity.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{activity.title}</p>
                <p className="text-sm text-slate-600">{activity.type}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Opportunities</p>
          <div className="mt-4 space-y-3">
            {customer.openOpportunities.map((deal: typeof customer.openOpportunities[number]) => (
              <div key={deal.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{deal.title}</p>
                <p className="text-sm text-slate-600">{deal.stage} · ${Number(deal.amount || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
