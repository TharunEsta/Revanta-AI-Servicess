import { prisma } from "@/lib/revanta-os/db";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { Card } from "@/components/ui";

export default async function CompaniesPage() {
  const session = await getSessionUser();
  if (!session?.orgId) return null;
  const companies = await prisma.company.findMany({
    where: { organizationId: session.orgId },
    include: { contacts: true, leads: true, deals: true },
    orderBy: { updatedAt: "desc" },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">CRM</p>
        <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          Companies
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {companies.map((company: typeof companies[number]) => (
          <Card key={company.id} className="bg-white">
            <p className="font-semibold text-slate-950">{company.name}</p>
            <p className="text-sm text-slate-600">{company.industry || "No industry"}</p>
            <p className="mt-3 text-sm text-slate-500">{company.website || company.email || company.phone || "No details"}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

