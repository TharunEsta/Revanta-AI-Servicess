import { prisma } from "@/lib/revanta-os/db";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { Card } from "@/components/ui";

export default async function DealsPage() {
  const session = await getSessionUser();
  if (!session?.orgId) return null;
  const deals = await prisma.deal.findMany({
    where: { organizationId: session.orgId },
    include: { company: true, lead: true, owner: true },
    orderBy: { updatedAt: "desc" },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">CRM</p>
        <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          Deals
        </h2>
      </div>
      <div className="grid gap-4">
        {deals.map((deal) => (
          <Card key={deal.id} className="bg-white">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{deal.title}</p>
                <p className="text-sm text-slate-600">{deal.company?.name || deal.lead?.companyName || "No company"}</p>
              </div>
              <div className="text-sm text-slate-600">
                <p>{deal.stage}</p>
                <p>{deal.currency} {deal.amount?.toString() || "0"}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

