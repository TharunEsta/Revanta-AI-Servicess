import { founderPoints } from "@/content/site";
import { buildMetadata } from "@/lib/seo";
import { Card, CtaBanner, PageHero } from "@/components/ui";

export const metadata = buildMetadata({
  title: "About",
  description:
    "Learn how Revanta AI approaches founder-led delivery, premium design, and scalable software execution.",
  path: "/about"
});

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="About Revanta AI"
        title="A founder-led software company built around premium execution."
        description="Revanta AI helps ambitious businesses move faster with sharper websites, stronger software systems, and AI automation that supports real operations."
        primaryCta={{ label: "Start Project", href: "/contact" }}
        secondaryCta={{ label: "View Services", href: "/services" }}
      />

      <section className="section pt-8">
        <div className="shell grid gap-6 md:grid-cols-2">
          {founderPoints.map((item) => (
            <Card key={item.title}>
              <h2 className="font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em]">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <CtaBanner />
    </main>
  );
}
