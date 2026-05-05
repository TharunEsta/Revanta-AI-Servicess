import { buildMetadata } from "@/lib/seo";
import { Card, CtaBanner, PageHero, SectionIntro } from "@/components/ui";

export const metadata = buildMetadata({
  title: "Domain Search and Setup",
  description:
    "Search, secure, and connect your domain inside a business-ready setup designed to launch cleanly from day one.",
  path: "/domain",
  keywords: [
    "domain search",
    "business domain setup",
    "domain management platform",
    "domain and email setup"
  ]
});

const benefits = [
  {
    title: "Built for real business launch",
    description:
      "Your domain is handled as part of the website, email, and system setup, not as a disconnected purchase."
  },
  {
    title: "Simple from the first search",
    description:
      "Find the right name, secure it confidently, and move straight into a setup that supports your business."
  },
  {
    title: "Ready to connect fast",
    description:
      "Everything is structured so your domain can move cleanly into launch, operations, and everyday use."
  }
];

const featurePoints = [
  "Search and secure the right business domain with confidence",
  "Keep website, email, and domain setup aligned from the start",
  "Manage your domain inside a cleaner business system experience",
  "Reduce setup friction and move toward launch faster"
];

export default function DomainSearchPage() {
  return (
    <main>
      <PageHero
        eyebrow="Revanta Domains"
        title="Secure the right domain and launch with everything connected"
        description="Revanta Domains gives businesses a cleaner way to search, secure, and manage domains as part of a complete digital setup."
        primaryCta={{ label: "Search Domains", href: "/contact" }}
        secondaryCta={{ label: "Plan My Setup", href: "/contact" }}
      />

      <section className="section pt-8">
        <div className="shell">
          <Card className="bg-white">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Domain search</p>
                <h2 className="mt-3 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
                  Search for the name your business should grow with
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                  Choose a domain that feels credible, memorable, and ready to support your brand
                  long term.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                <div className="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-400">
                  Search your business name, brand idea, or ideal domain
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Why buy here"
            title="A domain experience designed around launch, not just ownership"
            description="Revanta Domains fits into the bigger system so your business can move from search to live setup without unnecessary complexity."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {benefits.map((item) => (
              <Card key={item.title}>
                <h3 className="font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <Card>
            <SectionIntro
              eyebrow="Key benefits"
              title="Everything you need to move from domain search to business-ready setup"
              description="Clear, simple, and built for non-technical teams that want confidence from day one."
            />
            <div className="mt-10 grid gap-3 md:grid-cols-2">
              {featurePoints.map((item) => (
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

      <CtaBanner />
    </main>
  );
}
