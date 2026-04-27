import { caseStudies } from "@/content/site";
import { buildMetadata } from "@/lib/seo";
import { Card, CtaBanner, PageHero } from "@/components/ui";

export const metadata = buildMetadata({
  title: "Case Studies",
  description:
    "Explore anonymized Revanta AI case studies across lead handling, websites, and internal software systems.",
  path: "/case-studies"
});

export default function CaseStudiesPage() {
  return (
    <main>
      <PageHero
        eyebrow="Case studies"
        title="Examples of the business problems Revanta AI is built to solve."
        description="These anonymized case studies show the kind of lead, workflow, and software problems we help teams fix."
      />

      <section className="section pt-8">
        <div className="shell grid gap-6 lg:grid-cols-3">
          {caseStudies.map((study) => (
            <Card key={study.slug} className="flex h-full flex-col">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{study.category}</p>
              <h2 className="mt-4 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em]">{study.title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{study.summary}</p>
              <p className="mt-5 text-sm text-slate-600">
                <span className="font-semibold text-slate-950">Challenge:</span> {study.challenge}
              </p>
              <p className="mt-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-950">Solution:</span> {study.solution}
              </p>
              <p className="mt-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-950">Outcome:</span> {study.outcome}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <CtaBanner />
    </main>
  );
}
