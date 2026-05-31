import { prisma } from "@/lib/revanta-os/db";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { Card } from "@/components/ui";

export default async function OrganizationsPage() {
  const session = await getSessionUser();
  if (!session) return null;
  const organizations = await prisma.organization.findMany({
    include: {
      memberships: {
        include: { user: true, role: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Admin</p>
        <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          Organizations
        </h2>
      </div>
      <div className="grid gap-4">
        {organizations.map((organization) => (
          <Card key={organization.id} className="bg-white">
            <p className="font-semibold text-slate-950">{organization.name}</p>
            <p className="text-sm text-slate-600">{organization.slug}</p>
            <p className="mt-3 text-sm text-slate-500">{organization.memberships.length} members</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

