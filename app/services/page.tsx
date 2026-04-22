import Link from "next/link";
import { serviceHighlights } from "@/content/site";
import { buildMetadata } from "@/lib/seo";
import { Card, CtaBanner, PageHero } from "@/components/ui";

export const metadata = buildMetadata({
  title: "Services",
  description:
    "Explore Revanta AI services across AI automation, SaaS development, MVP development, UI/UX design, web development, automation systems, and custom software.",
  path: "/services"
});

export default function ServicesPage() {
  return (
    <main>
      <PageHero
        eyebrow="Services"
        title="A complete service architecture built for SEO, trust, and premium lead generation."
        description="Explore the full Revanta AI service lineup, from product builds and automation systems to integrations, consulting, and long-term technical support."
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

      <CtaBanner />
    </main>
  );
}
