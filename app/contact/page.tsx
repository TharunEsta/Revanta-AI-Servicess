import { ContactForm } from "@/components/contact-form";
import { Card, PageHero } from "@/components/ui";
import { siteConfig } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Request a quote or start a project conversation with Revanta AI for websites, automation, dashboards, and custom software.",
  path: "/contact"
});

export default function ContactPage() {
  return (
    <main>
      <PageHero
        eyebrow="Contact"
        title="Start a project conversation with clear business context."
        description="Share what you need to improve, what is slowing the team down, and what result you want from the build."
      />

      <section className="section pt-8">
        <div className="shell grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <ContactForm />

          <div className="grid gap-6">
            <Card>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Reach out</p>
              <div className="mt-5 space-y-4">
                <a href={`tel:${siteConfig.phone}`} className="block text-lg text-slate-950 hover:text-slate-700">
                  {siteConfig.phone}
                </a>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="block text-lg text-slate-950 hover:text-slate-700"
                >
                  {siteConfig.email}
                </a>
                <a
                  href={`mailto:${siteConfig.salesEmail}`}
                  className="block text-lg text-slate-950 hover:text-slate-700"
                >
                  {siteConfig.salesEmail}
                </a>
              </div>
            </Card>

            <Card>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Working style</p>
              <h2 className="mt-4 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em]">
                Clear, direct, and built around the business goal.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Revanta AI is based in {siteConfig.location} and works with founders and teams that
                want faster communication, practical systems, and fewer delivery surprises.
              </p>
            </Card>
            <Card>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">What to expect</p>
              <h2 className="mt-4 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em]">
                One clear form. One clear next step.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Use this form for quotes, consultations, or project planning. You will get a more
                useful response when the business goal, workflow, and timeline are clear upfront.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
