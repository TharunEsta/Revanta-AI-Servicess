import { ContactForm } from "@/components/contact-form";
import { Card, PageHero } from "@/components/ui";
import { siteConfig } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Book a consultation with Revanta AI for AI automation, SaaS development, websites, mobile apps, CRM ERP systems, and custom software.",
  path: "/contact"
});

export default function ContactPage() {
  return (
    <main>
      <PageHero
        eyebrow="Contact"
        title="Start a premium project conversation with Revanta AI."
        description="Book a consultation, send a direct message, or request a detailed quote. Revanta AI is positioned to support serious builds for ambitious businesses."
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
                Calm, direct, premium, and business-focused.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Revanta AI is based in {siteConfig.location} and built to help founders and teams
                move from vague requirements to serious launch-ready systems.
              </p>
            </Card>
            <Card>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">What to expect</p>
              <h2 className="mt-4 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em]">
                One clear form. One thoughtful response.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Use this single inquiry form for consultations, quotes, and project discussions.
                It keeps the process cleaner and helps Revanta AI respond with better context.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
