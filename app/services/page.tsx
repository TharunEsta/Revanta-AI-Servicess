import Link from "next/link";
import { serviceHighlights } from "@/content/site";
import { buildMetadata } from "@/lib/seo";
import { Card, CtaBanner, PageHero, SectionIntro } from "@/components/ui";

export const metadata = buildMetadata({
  title: "Services",
  description:
    "Explore Revanta AI services across websites, automation, SaaS products, internal tools, dashboards, and custom software.",
  path: "/services"
});

export default function ServicesPage() {
  return (
    <main>
      <PageHero
        eyebrow="Services"
        title="Business systems built to increase revenue, save time, and scale cleanly."
        description="Websites, automation, dashboards, and software built around the way your business actually works."
        primaryCta={{ label: "Book Consultation", href: "/contact" }}
      />

      <section className="section pt-8">
        <div className="shell grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {serviceHighlights.map((service) => (
            <Card key={service.slug} className="flex h-full flex-col justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  {service.eyebrow}
                </p>
                <h2 className="mt-4 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em]">{service.title}</h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">{service.description}</p>
              </div>
              <Link href={service.href} className="mt-8 button-primary w-fit">
                View Service Page
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Complete setup"
            title="Domain + Setup, Handled End-to-End"
            description="For many businesses, the hardest part is not the website or system itself. It is everything around it: choosing the right domain, configuring DNS, connecting hosting, and setting up email properly from the start."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Card>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                What Revanta AI handles
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Revanta AI manages the full setup so you do not have to coordinate separate steps
                across multiple places. We support domain selection, secure the domain,
                configure DNS, connect hosting, and set up email so the full system is aligned
                from day one.
              </p>

              <div className="mt-6 grid gap-3">
                {[
                  "Domain selection support based on your brand and business goals",
                  "Domain registration handled as part of the setup process",
                  "DNS configuration connected to the right environment",
                  "Hosting connection aligned with your website or system launch",
                  "Email setup completed so communication is ready from the start"
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-6">
              <Card>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Business benefits
                </h2>
                <div className="mt-6 grid gap-3">
                  {[
                    "No technical setup required from your side",
                    "Everything works from day one",
                    "Fully connected with your website and systems",
                    "No dependency on multiple platforms"
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  What happens after purchase
                </h2>
                <div className="mt-6 grid gap-4">
                  {[
                    {
                      title: "Domain secured",
                      description:
                        "Your business domain is selected, secured, and prepared for launch."
                    },
                    {
                      title: "System deployed",
                      description:
                        "Your website or platform is set up in the right environment and prepared to go live."
                    },
                    {
                      title: "Everything connected and live",
                      description:
                        "DNS, hosting, and email are connected so the full setup works as one complete system."
                    }
                  ].map((step) => (
                    <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <h3 className="text-base font-semibold text-slate-950">{step.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-sm leading-7 text-slate-600">
                  It is all handled as part of a complete business system setup.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner />
    </main>
  );
}
