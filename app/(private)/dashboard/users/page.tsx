import { prisma } from "@/lib/revanta-os/db";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { Card } from "@/components/ui";

export default async function UsersPage() {
  const session = await getSessionUser();
  if (!session) return null;
  const users = await prisma.user.findMany({
    include: { memberships: { include: { organization: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Admin</p>
        <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          Users
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {users.map((user) => (
          <Card key={user.id} className="bg-white">
            <p className="font-semibold text-slate-950">{user.name || user.email}</p>
            <p className="text-sm text-slate-600">{user.email}</p>
            <p className="mt-3 text-sm text-slate-500">{user.memberships.length} memberships</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

