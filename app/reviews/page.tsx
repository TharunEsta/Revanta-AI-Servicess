import Link from "next/link";
import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { CtaBanner, PageHero, SectionIntro, Card } from "@/components/ui";
import { AnimatedBackground } from "./_components/AnimatedBackground";
import { AutoScrollingTechMarquee } from "./_components/AutoScrollingTechMarquee";
import { CRMProductShowcase } from "./_components/CRMProductShowcase";
import { TrustCounters } from "./_components/TrustCounters";


export const metadata = buildMetadata({
  title: "Reviews & Trust Center",
  description:
    "Credibility and transparency from Revanta AI: trusted technology stack, operational experience, and development standards.",
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
          eyebrow="Trusted Technology Stack"
          title="Why Businesses Choose Revanta AI"
          description="Building AI-powered CRM systems, automation platforms, business software, and intelligent digital solutions using world-class technologies."
          primaryCta={{ label: "Talk to Our Team", href: "/contact" }}
          secondaryCta={{ label: "View Our Platform", href: "/revanta-os" }}
        />

        <div className="-mt-10 sm:-mt-12">
          <div className="shell">
            <div className="panel relative overflow-hidden bg-white/70 p-6 sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_45%)]" />
              <div className="relative">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                  <div>
                    <SectionIntro
                      eyebrow="Trust through product"
                      title="We build serious software—CRM, automation, and operational platforms"
                      description="No fake testimonials. Just technology, engineering standards, and transparent placeholders." 
                    />
                  </div>
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
          <SectionIntro
            eyebrow="Technology Ecosystem"
            title="Auto-scrolling technology ecosystem (actively used)"
            description="Trusted global infrastructure and AI providers that power internal systems and client solutions."
          />
          <div className="mt-10">
            <AutoScrollingTechMarquee />
          </div>
        </div>
      </section>

      <SectionDivider />


      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Operational experience"
            title="Built With Real Operational Experience"
            description="The systems we build are inspired by real business needs, operational workflows, and automation challenges."
          />

          <div className="mt-10">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Lead Management",
                  description: "Capture, qualify, and move inquiries through a clean pipeline designed for action.",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M7 7h10v10H7z" />
                      <path d="M9 12h6" />
                    </svg>
                  )
                },
                {
                  title: "Customer Relationship Management",
                  description: "Centralize customer context, history, and collaboration for consistent follow-up.",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z" />
                      <path d="M9.5 10.5l1.7 1.7 3.4-3.8" />
                    </svg>
                  )
                },
                {
                  title: "Project Tracking",
                  description: "Coordinate delivery stages with clarity—so teams always know the next move.",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 7h16" />
                      <path d="M4 12h16" />
                      <path d="M4 17h16" />
                    </svg>
                  )
                },
                {
                  title: "Workflow Automation",
                  description: "Automate scheduling, follow-ups, notifications, and internal routing reliably.",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M7 4h10v6H7z" />
                      <path d="M4 14h16v6H4z" />
                    </svg>
                  )
                },
                {
                  title: "Analytics Dashboard",
                  description: "Turn operational data into actionable dashboards built for managers and owners.",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 19V5" />
                      <path d="M4 19h16" />
                      <path d="M8 15l3-4 3 2 4-6" />
                    </svg>
                  )
                },
                {
                  title: "Team Collaboration",
                  description: "Keep context, tasks, and conversations aligned across your organization.",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M16 11a4 4 0 10-8 0" />
                      <path d="M12 15c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
                    </svg>
                  )
                }
              ].map((c) => (
                <div key={c.title}>
                  <HorizontalShowcaseCard title={c.title} description={c.description} icon={c.icon} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <SectionDivider />

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Inside Revanta CRM"
            title="Revanta CRM (Operational Platform)"
            description="Revanta CRM is our internally developed operational platform used to manage leads, workflows, projects, and business operations."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Lead Pipeline", desc: "Manage inquiry stages with clear ownership, reminders, and progression logic." },
              { title: "Customer Database", desc: "Centralized records and history to keep teams aligned and fast." },
              { title: "Task Management", desc: "Structured tasks for delivery and follow-up with reliable status tracking." },
              { title: "Automation Engine", desc: "Workflow automation built to reduce manual admin and accelerate actions." },
              { title: "Reporting Dashboard", desc: "Operational analytics for owners and managers—built for decision-making." },
              { title: "Business Operations", desc: "Operational workflows that keep processes consistent and measurable." }
            ].map((f) => (
              <Card key={f.title} className="bg-white p-6">
                <div className="space-y-3">
                  <h3 className="font-[var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-slate-950">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-7 text-slate-600">{f.desc}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-10">
            <CRMProductShowcase />
          </div>


          <div className="mt-12">
            <WhatsAppRow />
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="How We Build"
            title="Development standards designed for trust"
            description="Modern architecture, secure development practices, scalable systems, and clean workflow automation—built to deliver long-term business value."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Modern Architecture",
                description: "Maintainable system design that scales with changing product requirements.",
                icon: (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 7h7v7H4z" />
                    <path d="M13 5h7v7h-7z" />
                    <path d="M13 14h7v7h-7z" />
                  </svg>
                )
              },
              {
                title: "Cloud Infrastructure",
                description: "Reliable deployment and infrastructure workflows for predictable delivery.",
                icon: (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M7 18a4 4 0 010-8 5 5 0 019.7-1.7A3.5 3.5 0 0119 18H7z" />
                  </svg>
                )
              },
              {
                title: "AI Integration",
                description: "Practical AI integration patterns designed for operational workflows.",
                icon: (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z" />
                  </svg>
                )
              },
              {
                title: "Secure Development",
                description: "Security-minded implementation practices—privacy, reliability, and safe integrations.",
                icon: (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 3l8 4v6c0 5-3.5 8-8 8s-8-3-8-8V7l8-4z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                )
              },
              {
                title: "Workflow Automation",
                description: "Automations built around real operations—reminders, routing, and event-driven actions.",
                icon: (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M7 4h10v6H7z" />
                    <path d="M4 14h16v6H4z" />
                  </svg>
                )
              },
              {
                title: "Scalable Systems",
                description: "Performance and scalability considerations built into the foundation.",
                icon: (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 19V5" />
                    <path d="M4 19h16" />
                    <path d="M8 14l2-3 2 2 4-6" />
                  </svg>
                )
              }
            ].map((x) => (
              <SmallGridCard key={x.title} title={x.title} description={x.description} icon={x.icon} />
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Capabilities"
            title="Software & automation for modern operations"
            description="AI agents, CRM development, business automation, internal platforms, dashboards, and integrations—engineered for reliability."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "AI Agents",
              "CRM Development",
              "Business Automation",
              "Internal Platforms",
              "Custom Dashboards",
              "Workflow Systems",
              "Client Portals",
              "Software Integrations"
            ].map((cap) => (
              <Card
                key={cap}
                className="group relative bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(17,17,17,0.10)]"
              >
                <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-50 via-transparent to-emerald-50 opacity-0 transition group-hover:opacity-100" />
                <div className="relative flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-[var(--font-display)] text-lg font-semibold tracking-[-0.04em] text-slate-950">
                      {cap}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Built with reliability, clarity, and long-term usability in mind.
                    </p>
                  </div>
                  <div className="text-slate-500 transition group-hover:text-slate-900">
                    <ChevronRight />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Traditional Operations vs Revanta AI"
            title="Clear outcomes, measurable automation, and centralized visibility"
            description="Replace manual lead tracking and scattered data with an operational CRM + automation layer."
          />

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <Card className="relative overflow-hidden bg-white p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.14),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_55%)]" />
              <div className="relative">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Traditional Operations</div>
                <div className="mt-4 space-y-4">
                  {[
                    { a: "Manual Lead Tracking", b: "Delayed, inconsistent follow-ups" },
                    { a: "Delayed Responses", b: "Prospects cool off before actions" },
                    { a: "Scattered Data", b: "Reports require manual stitching" },
                    { a: "Repetitive Tasks", b: "Time drains from delivery" }
                  ].map((row) => (
                    <div key={row.a} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="text-sm font-semibold text-slate-950">{row.a}</div>
                      <div className="mt-2 text-sm leading-7 text-slate-600">{row.b}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden bg-slate-950 p-7 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.35),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.30),transparent_52%)]" />
              <div className="relative">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Revanta AI Systems</div>
                <div className="mt-4 space-y-4">
                  {[
                    { a: "Automated CRM Pipeline", b: "Clean stages, reminders, and action routing" },
                    { a: "Instant Follow-Ups", b: "Right message at the right time" },
                    { a: "Centralized Dashboard", b: "Managers see operational reality instantly" },
                    { a: "Automated Workflows", b: "Less manual admin, more delivery focus" }
                  ].map((row) => (
                    <div key={row.a} className="rounded-[1.5rem] border border-white/15 bg-white/5 px-4 py-4">
                      <div className="text-sm font-semibold text-white">{row.a}</div>
                      <div className="mt-2 text-sm leading-7 text-white/70">{row.b}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {[
              { title: "Manual Lead Tracking", desc: "→ Automated CRM Pipeline" },
              { title: "Delayed Responses", desc: "→ Instant Follow-Ups" },
              { title: "Scattered Data", desc: "→ Centralized Dashboard" },
              { title: "Repetitive Tasks", desc: "→ Automated Workflows" }
            ].map((x) => (
              <Card key={x.title} className="bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(17,17,17,0.10)]">
                <div className="text-sm font-semibold text-slate-900">{x.title}</div>
                <div className="mt-2 text-sm text-slate-600">{x.desc}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Our Approach"
            title="Trust is built through transparency and engineering clarity"
            description="Every system is designed with scalability, usability, and long-term business value in mind. We build operational software that teams can actually run."
          />

          <div className="mt-10 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="relative overflow-hidden bg-white p-7">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-transparent to-emerald-50 opacity-0 transition hover:opacity-100" />
              <div className="relative space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Credibility checklist</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "Technology choices aligned to reliability",
                    "Operational workflows first",
                    "Clean UX and measurable outcomes",
                    "Security-minded implementation",
                    "Maintainable code and scalable patterns",
                    "Transparent scope and next steps"
                  ].map((t) => (
                    <div key={t} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:bg-white">
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="bg-slate-950 p-7 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">Talk to the team</p>
              <h3 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.04em] text-white">Let’s build your next system</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Whether you need CRM software, AI automation, workflow optimization, or custom business platforms, our team is ready to help.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <WhatsAppCta />
                <Link href="/contact" className="button-secondary">
                  Contact Revanta AI
                </Link>
              </div>
              <p className="mt-5 text-sm text-slate-300">Built with trusted technologies. Focused on real business outcomes.</p>
            </Card>
          </div>
        </div>
      </section>


      {/* Built and Operated by Revanta AI */}
      <section className="section pt-8">
        <div className="shell">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 lg:p-10 shadow-soft">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_45%)]" />

            <div className="relative">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl space-y-4">
                  <span className="eyebrow">Internal Production Platform</span>
                  <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-slate-950 sm:text-4xl">
                    Built and Operated by Revanta AI
                  </h2>
                  <p className="text-base leading-8 text-slate-600">
                    Revanta CRM is actively developed and used by Revanta AI to manage leads, customer relationships, conversations, workflows, projects, and daily business operations.
                  </p>
                </div>
              </div>

              <div className="mt-10 space-y-8">
                {/* Screenshot 1 */}
                <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
                  <div className="order-2 lg:order-1">
                    <div className="space-y-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Revanta CRM Dashboard</p>
                      <h3 className="font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                        Revanta CRM Dashboard
                      </h3>
                      <p className="text-sm leading-7 text-slate-600">
                        A centralized business operations platform for managing leads, projects, WhatsApp activity, workflows, analytics, tasks, and customer relationships from a single workspace.
                      </p>
                    </div>
                  </div>

                  <div className="order-1 lg:order-2">
                    <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-soft">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/revanta-dashboard.png"
                        alt="Revanta CRM Dashboard"
                        width={1400}
                        height={900}
                        className="h-auto w-full object-cover transition duration-500 hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>

                {/* Screenshot 2 */}
                <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
                  <div className="order-1 lg:order-1">
                    <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-soft">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/revanta-conversations.png"
                        alt="Lead & Conversation Management"
                        width={1400}
                        height={900}
                        className="h-auto w-full object-cover transition duration-500 hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <div className="order-2 lg:order-2">
                    <div className="space-y-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Lead & Conversation Management</p>
                      <h3 className="font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                        Lead & Conversation Management
                      </h3>
                      <p className="text-sm leading-7 text-slate-600">
                        Track prospects, manage follow-ups, assign ownership, monitor WhatsApp conversations, maintain customer records, and streamline communication workflows.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm leading-7 text-slate-700">
                    Every screenshot shown on this page comes directly from Revanta CRM, our internally developed and actively used operational platform.
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    These are actual product interfaces, not concept designs or marketing mockups.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <CtaBanner />

      {/* Ensure required WhatsApp number appears on page */}
      <div className="sr-only" aria-hidden="true">
        WhatsApp contact: +91 90147 19422
      </div>

      <Suspense fallback={null} />
    </main>
  );
}


