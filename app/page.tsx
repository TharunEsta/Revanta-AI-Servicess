import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui";

export const metadata = buildMetadata({
  title: "Automate Bookings, Leads and Operations in Days",
  description:
    "Revanta AI builds custom websites, booking systems, AI automations, dashboards, and software that help growing businesses save time and increase revenue.",
  path: "/"
});

export default function HomePage() {
  return (
    <main>
      <PageHero
        eyebrow="Revanta AI"
        title="We build and operate CRM, automation and business systems"
        description="Revanta AI runs operational software: CRM systems, WhatsApp automation, internal dashboards, AI workflows, and booking flows."
        primaryCta={{ label: "Book Consultation", href: "/contact" }}
        secondaryCta={{ label: "View Services", href: "/services" }}
      />

      <section className="section pb-10 pt-10">
        <div className="shell">
          <div className="space-y-3">
            <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
              Software We Build and Operate
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "CRM Systems",
              "WhatsApp Automation",
              "Lead Management",
              "Internal Dashboards",
              "AI Workflows",
              "Booking Systems"
            ].map((t) => (
              <div
                key={t}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
              >
                <div className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                  {t}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section pb-10 pt-10">
        <div className="shell">
          <div className="panel bg-white p-7 sm:p-10">
            <div className="space-y-4">
              <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
                Built From Real Operational Needs
              </h2>
              <p className="max-w-3xl text-base leading-8 text-slate-600">
                Revanta AI started after building internal systems to manage leads,
                communication, follow-up and operations more effectively.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section pb-10 pt-10">
        <div className="shell">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                Ready to Build Software That Runs Your Business?
              </h2>

              <div className="mt-7 grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">Phone</div>
                  <div className="mt-1">+91 90147 19422</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">WhatsApp</div>
                  <div className="mt-1">+91 90147 19422</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">Email</div>
                  <div className="mt-1">
                    <a
                      href="mailto:hello@revantaai.com"
                      className="text-slate-950 hover:underline"
                    >
                      hello@revantaai.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <Link href="/contact" className="button-primary">
                  Book Consultation
                </Link>
                <Link href="/contact" className="button-secondary">
                  Talk to Founder
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


