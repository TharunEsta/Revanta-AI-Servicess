import { getSessionUser } from "@/lib/revanta-os/auth";
import { getRevenueMetrics } from "@/lib/revanta-os/business";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/revanta-os/db";

export default async function FinancePage() {
  const session = await getSessionUser();
  if (!session?.orgId) return null;

  const metrics = await getRevenueMetrics(session.orgId);
  const [invoices, payments, expenses, subscriptions] = await Promise.all([
    prisma.invoice.findMany({ where: { organizationId: session.orgId }, include: { customer: true, project: true, items: true }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.payment.findMany({ where: { organizationId: session.orgId }, include: { invoice: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.expense.findMany({ where: { organizationId: session.orgId }, include: { project: true }, orderBy: { incurredAt: "desc" }, take: 8 }),
    prisma.subscription.findMany({ where: { organizationId: session.orgId }, include: { plan: true }, orderBy: { createdAt: "desc" }, take: 8 })
  ]);

  const widgets = [
    { label: "Invoiced", value: metrics.totalInvoiced },
    { label: "Paid", value: metrics.totalPaid },
    { label: "Expenses", value: metrics.totalExpenses },
    { label: "Revenue", value: metrics.revenue },
    { label: "Pending invoices", value: metrics.pendingPayments },
    { label: "Overdue invoices", value: metrics.overdueInvoices }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Finance</p>
        <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          Revenue operations
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {widgets.map((widget) => (
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
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Invoices</p>
          <div className="mt-4 space-y-3">
            {invoices.map((invoice: typeof invoices[number]) => (
              <div key={invoice.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{invoice.number}</p>
                <p className="text-sm text-slate-600">{invoice.status} · {invoice.currency} {invoice.total.toString()}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Payments</p>
          <div className="mt-4 space-y-3">
            {payments.map((payment: typeof payments[number]) => (
              <div key={payment.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{payment.provider}</p>
                <p className="text-sm text-slate-600">{payment.status} · {payment.currency} {payment.amount.toString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Expenses</p>
          <div className="mt-4 space-y-3">
            {expenses.map((expense: typeof expenses[number]) => (
              <div key={expense.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{expense.title}</p>
                <p className="text-sm text-slate-600">{expense.category} · {expense.currency} {expense.amount.toString()}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="bg-white">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Subscriptions</p>
          <div className="mt-4 space-y-3">
            {subscriptions.map((subscription: typeof subscriptions[number]) => (
              <div key={subscription.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{subscription.plan.name}</p>
                <p className="text-sm text-slate-600">{subscription.status} · {subscription.billingCycle}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
