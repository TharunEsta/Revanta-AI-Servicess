import Link from "next/link";
import { StructuredData } from "@/components/structured-data";
import { Card, CtaBanner, PageHero, SectionIntro } from "@/components/ui";
import { coreServicePages } from "@/content/core-services";
import { serviceSchema } from "@/lib/seo";

type CoreServiceKey = keyof typeof coreServicePages;

export function CoreServicePage({ slug }: { slug: CoreServiceKey }) {
  const page = coreServicePages[slug];

  return (
    <main>
      <StructuredData data={serviceSchema(page.title, page.metaDescription, page.path)} />
      <PageHero
        eyebrow={page.title}
        title={page.hero.headline}
        description={page.hero.subheadline}
        primaryCta={{ label: page.hero.cta, href: "/contact" }}
        secondaryCta={{ label: "Talk to Founder", href: "/contact" }}
      />

      <section className="section pt-8">
        <div className="shell">
          <Card>
            <SectionIntro
              eyebrow="The problem"
              title="This is where businesses start losing time, leads, and control"
              description={page.problem[0]}
            />
            <div className="mt-8 grid gap-4">
              {page.problem.slice(1).map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-slate-600">
                  {paragraph}
                </p>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              What we do
            </h2>
            <div className="mt-6 grid gap-4">
              {page.solution.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-slate-600">
                  {paragraph}
                </p>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Who this is for
            </h2>
            <div className="mt-6 grid gap-3">
              {page.audience.map((item) => (
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
            eyebrow="How it works"
            title="A simple flow that makes the system easy to understand"
            description="We keep the structure clear so you can see exactly how the problem gets turned into an outcome."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {page.flow.map((step, index) => (
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
        <div className="shell grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <Card>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Why this matters
            </h2>
            <div className="mt-6 grid gap-4">
              {page.impact.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-slate-600">
                  {paragraph}
                </p>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              What you get
            </h2>
            <div className="mt-6 grid gap-3">
              {page.outcomes.map((item) => (
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
          <Card className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Next step</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {page.cta.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{page.cta.description}</p>
            </div>
            <Link href="/contact" className="button-primary">
              {page.cta.label}
            </Link>
          </Card>
        </div>
      </section>

      <CtaBanner />
    </main>
  );
}
