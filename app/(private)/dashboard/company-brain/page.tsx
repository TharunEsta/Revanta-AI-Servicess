import { prisma } from "@/lib/revanta-os/db";
import { getSessionUser } from "@/lib/revanta-os/auth";
import { getCompanyKnowledgeStats } from "@/lib/revanta-os/knowledge";
import { Card } from "@/components/ui";
import { CompanyBrainManager } from "@/components/company-brain-manager";

export default async function CompanyBrainPage() {
  const session = await getSessionUser();
  if (!session?.orgId) return null;

  const [entries, knowledgeBases, stats] = await Promise.all([
    prisma.companyKnowledge.findMany({
      where: { organizationId: session.orgId },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.knowledgeBase.findMany({
      where: { organizationId: session.orgId },
      orderBy: { updatedAt: "desc" }
    }),
    getCompanyKnowledgeStats(session.orgId)
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Company Brain</p>
        <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          Revanta company knowledge and retrieval
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Knowledge bases", value: stats.knowledgeBaseCount },
          { label: "Documents", value: stats.documentCount },
          { label: "Chunks", value: stats.chunkCount },
          { label: "Company entries", value: stats.companyKnowledgeCount }
        ].map((item) => (
          <Card key={item.label} className="bg-white">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
            <p className="mt-4 font-[var(--font-display)] text-4xl font-semibold tracking-[-0.06em] text-slate-950">
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <CompanyBrainManager entries={entries} knowledgeBases={knowledgeBases} />
    </div>
  );
}
