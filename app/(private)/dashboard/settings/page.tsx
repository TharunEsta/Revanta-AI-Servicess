import { prisma } from "@/lib/revanta-os/db";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { Card } from "@/components/ui";

export default async function SettingsPage() {
  const session = await getSessionUser();
  if (!session?.orgId) return null;
  const organization = await prisma.organization.findUnique({
    where: { id: session.orgId },
    include: { memberships: { include: { user: true, role: true } } }
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Settings</p>
        <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          Organization Settings
        </h2>
      </div>
      <Card className="bg-white">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Current organization</p>
        <h3 className="mt-4 text-2xl font-semibold text-slate-950">{organization?.name || "Unknown"}</h3>
        <p className="mt-2 text-sm text-slate-600">{organization?.slug}</p>
        <p className="mt-4 text-sm text-slate-500">Members: {organization?.memberships.length || 0}</p>
      </Card>
    </div>
  );
}

