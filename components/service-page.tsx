import Link from "next/link";
import { serviceDetails } from "@/content/site";
import { StructuredData } from "@/components/structured-data";
import { serviceSchema } from "@/lib/seo";
import { Card, CtaBanner, PageHero, SectionIntro } from "@/components/ui";

type ServiceKey = keyof typeof serviceDetails;

export function ServicePage({ slug }: { slug: ServiceKey }) {
  const service = serviceDetails[slug];

  return (
    <main>
      <StructuredData
        data={serviceSchema(service.title, service.summary, service.path)}
      />
      <PageHero
        eyebrow={service.title}
        title={`${service.title} for companies that want sharper execution and stronger trust.`}
        description={service.intro}
        primaryCta={{ label: "Book Consultation", href: "/contact" }}
        secondaryCta={{ label: "View Services", href: "/services" }}
      />

      <section className="section pt-8">
        <div className="shell grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">What this solves</h2>
            <div className="mt-6 grid gap-4">
              {service.problems.map((problem) => (
                <div
                  key={problem}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600"
                >
                  {problem}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">What Revanta AI delivers</h2>
            <div className="mt-6 grid gap-4">
              {service.deliverables.map((deliverable) => (
                <div
                  key={deliverable}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600"
                >
                  {deliverable}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Ideal client fit"
            title={`Built for ${service.idealFor.join(", ")}.`}
            description={service.summary}
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {service.idealFor.map((item) => (
              <Card key={item} className="min-h-[180px]">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Best for</p>
                <h3 className="mt-4 font-[var(--font-display)] text-xl font-semibold tracking-[-0.04em] capitalize text-slate-950">
                  {item}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Strong fit for teams that want a cleaner operating model and a more serious
                  product-quality result.
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <Card className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Commercial intent
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                Better positioned for premium deals, clearer delivery, and stronger buyer trust.
              </h2>
            </div>
            <Link href="/contact" className="button-primary">
              Discuss Your Build
            </Link>
          </Card>
        </div>
      </section>

      <CtaBanner />
    </main>
  );
}
