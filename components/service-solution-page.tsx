import Link from "next/link";
import { solutionPages } from "@/content/solution-pages";
import { StructuredData } from "@/components/structured-data";
import { serviceSchema } from "@/lib/seo";
import { Card, CtaBanner, PageHero, SectionIntro } from "@/components/ui";

type SolutionPageKey = keyof typeof solutionPages;

export function ServiceSolutionPage({ slug }: { slug: SolutionPageKey }) {
  const page = solutionPages[slug];

  return (
    <main>
      <StructuredData
        data={serviceSchema(page.title, page.metaDescription, page.path)}
      />

      <PageHero
        eyebrow={page.title}
        title={page.headline}
        description={page.opening}
        primaryCta={{ label: "Book Consultation", href: "/contact" }}
        secondaryCta={{ label: "Talk to Revanta AI", href: "/contact" }}
      />

      <section className="section pt-8">
        <div className="shell">
          <Card>
            <SectionIntro
              eyebrow="The problem"
              title={page.problemTitle}
              description={page.problemBody}
            />
          </Card>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">What this system does</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{page.whatItDoes}</p>
          </Card>

          <Card>
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">Who this is for</h2>
            <div className="mt-6 grid gap-3">
              {page.whoItsFor.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Business outcomes"
            title="Key benefits your team will feel quickly"
            description={page.benefitsIntro}
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {page.benefits.map((benefit) => (
              <Card key={benefit.title} className="flex h-full flex-col">
                <h3 className="font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {benefit.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="How it works"
            title={page.stepsTitle}
            description={page.stepsIntro}
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {page.steps.map((step, index) => (
              <Card key={step.title}>
                <p className="text-sm uppercase tracking-[0.26em] text-slate-500">
                  Step {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Real-world use cases"
            title={page.useCasesTitle}
            description={page.useCasesIntro}
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {page.useCases.map((useCase) => (
              <Card key={useCase.title}>
                <h3 className="font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {useCase.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{useCase.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <Card className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Next step</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                {page.closingTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{page.closingBody}</p>
            </div>
            <Link href="/contact" className="button-primary">
              {page.closingCta}
            </Link>
          </Card>
        </div>
      </section>

      <CtaBanner />
    </main>
  );
}
