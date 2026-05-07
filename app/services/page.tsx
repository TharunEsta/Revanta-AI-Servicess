import Link from "next/link";
import { coreServiceHighlights } from "@/content/core-services";
import { buildMetadata } from "@/lib/seo";
import { Card, CtaBanner, PageHero } from "@/components/ui";

export const metadata = buildMetadata({
  title: "Services",
  description:
    "Explore Revanta AI's five core services built to fix missed leads, messy sales processes, broken workflows, weak digital experiences, and disconnected systems.",
  path: "/services"
});

export default function ServicesPage() {
  return (
    <main>
      <PageHero
        eyebrow="Services"
        title="Five core services built around the real problems slowing businesses down."
        description="Revanta AI helps businesses fix missed leads, messy sales processes, broken workflows, weak digital experiences, and disconnected systems."
        primaryCta={{ label: "Book Consultation", href: "/contact" }}
      />

      <section className="section pt-8">
        <div className="shell grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {coreServiceHighlights.map((service) => (
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

      <CtaBanner />
    </main>
  );
}
