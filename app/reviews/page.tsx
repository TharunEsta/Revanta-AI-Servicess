import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui";
import { AnimatedBackground } from "./_components/AnimatedBackground";
import { Card } from "@/components/ui";
import { TrustCounters } from "./_components/TrustCounters";
import { CtaBanner } from "@/components/ui";
import { AutoScrollingTechMarquee } from "./_components/AutoScrollingTechMarquee";

export const metadata = buildMetadata({
  title: "Reviews & Trust Center",
  description:
    "Credibility and transparency from Revanta AI: operational experience and development standards.",
  path: "/reviews"
});

function WhatsAppCta() {
  const phone = "9014719422";
  const text = encodeURIComponent(
    "Hi Revanta AI team — I’m interested in building a Revanta CRM / automation system. Please connect with me."
  );
  return (
    <a
      href={`https://wa.me/${phone}?text=${text}`}
      className="button-primary"
      target="_blank"
      rel="noreferrer"
    >
      WhatsApp +91 90147 19422
    </a>
  );
}

function Icon({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={
        "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 " +
        (className ?? "")
      }
    >
      {children}
    </span>
  );
}

function SectionDivider() {
  return (
    <div className="mx-auto mt-14 h-px max-w-5xl bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
  );
}



function HorizontalShowcaseCard({
  title,
  description,
  icon
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="h-full bg-white">
      <div className="flex items-start gap-4">
        <Icon>{icon}</Icon>
        <div className="space-y-2">
          <h3 className="font-[var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-slate-950">
            {title}
          </h3>
          <p className="text-sm leading-7 text-slate-600">{description}</p>
        </div>
      </div>
    </Card>
  );
}

function SmallGridCard({
  title,
  description,
  icon
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="h-full bg-white transition duration-300 hover:-translate-y-1 hover:bg-slate-50">
      <div className="space-y-4">
        <Icon>{icon}</Icon>
        <div>
          <h3 className="font-[var(--font-display)] text-lg font-semibold tracking-[-0.04em] text-slate-950">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
        </div>
      </div>
    </Card>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function WhatsAppRow() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-2xl space-y-3">
        <p className="text-base font-semibold text-slate-950">Interested in implementing a custom CRM for your organization?</p>
        <p className="text-sm leading-7 text-slate-600">
          Call or WhatsApp our team. We’ll align on your workflows and propose the right build approach.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a href="tel:+919014719422" className="button-secondary">
          Call +91 90147 19422
        </a>
        <WhatsAppCta />
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <main>
      <div className="relative">
        <AnimatedBackground />
        <PageHero
          eyebrow="Reviews"
          title="Why Businesses Choose Revanta AI"
          description="Building AI-powered CRM systems, automation platforms, business software, and intelligent digital solutions."
          primaryCta={{ label: "Talk to Our Team", href: "/contact" }}
          secondaryCta={{ label: "View Services", href: "/services" }}
        />

        <div className="-mt-10 sm:-mt-12">
          <div className="shell">
            <div className="panel relative overflow-hidden bg-white/70 p-6 sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_45%)]" />
              <div className="relative">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                  <div />

                  <div>
                    <TrustCounters />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section pt-10">
        <div className="shell">
          <div className="space-y-3">
            <h2 className="text-left font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
              Technology Stack
            </h2>
          </div>

          <div className="mt-10">
            <AutoScrollingTechMarquee />
          </div>
        </div>
      </section>

      <SectionDivider />

      <CtaBanner />

      {/* Ensure required WhatsApp number appears on page */}
      <div className="sr-only" aria-hidden="true">
        WhatsApp contact: +91 90147 19422
      </div>

      <Suspense fallback={null} />
    </main>
  );
}


