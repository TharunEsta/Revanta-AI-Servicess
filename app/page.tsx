import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Card, CtaBanner, PageHero, SectionIntro } from "@/components/ui";

export const metadata = buildMetadata({
  title: "Automate Bookings, Leads and Operations in Days",
  description:
    "Revanta AI builds custom websites, booking systems, AI automations, dashboards, and software that help growing businesses save time and increase revenue.",
  path: "/"
});

const trustPoints = [
  "Founder-led execution",
  "Fast communication",
  "Designed for ROI"
];

const heroChips = [
  "Custom websites",
  "Booking systems",
  "AI automations",
  "Dashboards",
  "Internal software"
];

const leadGrowthPoints = [
  "Capture more inquiries",
  "Faster response systems",
  "WhatsApp booking flows",
  "Better conversion funnels"
];

const saveTimePoints = [
  "Automate repetitive tasks",
  "Quote generation",
  "Appointment scheduling",
  "Follow-up reminders"
];

const visibilityPoints = [
  "Dashboards",
  "Reports",
  "Lead tracking",
  "Team performance"
];

const tailoredSystemPoints = [
  "Websites",
  "CRM integrations",
  "AI assistants",
  "Internal software"
];

const benefits = [
  {
    eyebrow: "Lead growth",
    title: "Capture more demand without chasing every inquiry manually",
    description:
      "Build a cleaner first impression, respond faster, and move more prospects into booked calls, visits, or quotes.",
    points: leadGrowthPoints
  },
  {
    eyebrow: "Save time",
    title: "Remove repetitive work that slows down your team every day",
    description:
      "Automate the follow-up, scheduling, reminders, and quoting work that usually gets handled in chats and spreadsheets.",
    points: saveTimePoints
  },
  {
    eyebrow: "Full visibility",
    title: "See what is happening across leads, bookings, and operations",
    description:
      "Get practical dashboards and reporting so owners and managers can track performance without piecing numbers together manually.",
    points: visibilityPoints
  },
  {
    eyebrow: "Tailored systems",
    title: "Use software built around how your business already works",
    description:
      "From websites to dashboards to CRM-connected workflows, each system is shaped around your sales and operations reality.",
    points: tailoredSystemPoints
  }
];

const solutions = [
  {
    title: "Websites that generate better inquiries",
    description: "Stronger trust, sharper offer presentation, and clearer action paths."
  },
  {
    title: "Booking and appointment systems",
    description: "Reduce back-and-forth and let clients book faster."
  },
  {
    title: "AI automations for follow-up and admin work",
    description: "Keep the process moving without extra manual effort."
  },
  {
    title: "Dashboards and internal tracking tools",
    description: "Get visibility over leads, staff, and delivery performance."
  },
  {
    title: "CRM and software integrations",
    description: "Connect the tools you already use so data flows cleanly."
  },
  {
    title: "Custom internal software",
    description: "Build around your workflow instead of forcing your team into mismatched tools."
  }
];

const industries = [
  "Clinics",
  "Real Estate",
  "Logistics",
  "Hotels",
  "Travel",
  "Legal",
  "Wellness"
];

const conversionSteps = [
  {
    step: "01",
    title: "We review your current lead or operations bottleneck",
    description: "You share the problem, the workflow, and the business goal."
  },
  {
    step: "02",
    title: "We recommend the fastest practical system to fix it",
    description: "Website, booking flow, automation, dashboard, or custom build."
  },
  {
    step: "03",
    title: "You get a clear scope and next-step quote",
    description: "No vague agency pitch. Just the right build path for the business."
  }
];

const founderPrinciples = [
  "Premium execution over rushed delivery",
  "Faster founder-level communication",
  "Systems built around real business needs",
  "Practical growth outcomes, not empty promises",
  "Long-term value instead of short-term fixes"
];

const founderLinks = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/tharun-esta-30035624a/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 9v8" />
        <path d="M11 12.5V17" />
        <path d="M11 12.5c0-1.5 1-2.5 2.5-2.5S16 11 16 12.5V17" />
        <path d="M7 7h.01" />
        <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      </svg>
    )
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/tharun_esta/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="3.8" />
        <path d="M17.4 6.7h.01" />
      </svg>
    )
  }
];

const founderProofCards = [
  {
    title: "Products Built",
    items: ["CareerForge", "ForgeIDE (Testing)"]
  },
  {
    title: "Integrations Worked With",
    items: ["Payment Gateways", "Authentication", "Email Systems", "APIs"]
  },
  {
    title: "Technologies Used",
    items: ["React", "Next.js", "Node.js", "Firebase", "AI APIs", "Automation Tools"]
  },
  {
    title: "Industries Built For",
    items: ["Healthcare", "Real Estate", "Logistics", "Education", "Wellness", "Service Brands"]
  }
];

export default function HomePage() {
  return (
    <main>
      <PageHero
        eyebrow="Revanta AI"
        title="Automate bookings, leads and operations in days"
        description="Revanta AI builds custom websites, booking systems, AI automations, dashboards, software, and Revanta OS for teams that want more control and faster execution."
        primaryCta={{ label: "Request a Quote", href: "/contact" }}
        secondaryCta={{ label: "Explore Revanta OS", href: "/revanta-os" }}
      />

      <section className="-mt-8 pb-8 sm:-mt-10">
        <div className="shell">
          <div className="panel overflow-hidden bg-white">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Free Systems Audit for First 20 Businesses This Week
                </p>
                <h2 className="mt-3 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
                  Faster leads. Better follow-up. Full control.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                  Built for founders, operations heads, and business owners who want clearer
                  systems, better follow-up, and less manual work slowing the team down.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/contact" className="button-primary">
                    Get My Quote
                  </Link>
                  <Link href="/contact" className="button-secondary">
                    Book Consultation
                  </Link>
                  <Link href="/revanta-os" className="button-secondary">
                    See Revanta OS
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {heroChips.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700"
                  >
                    {item}
                  </div>
                ))}
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 px-4 py-4 text-sm font-medium text-white sm:col-span-2">
                  {trustPoints.join(" | ")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Benefits"
            title="What business owners actually get from the right system"
            description="Shorter response time, cleaner follow-up, less admin work, and better visibility across leads and operations."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {benefits.map((item) => (
              <Card key={item.title} className="flex h-full flex-col justify-between bg-white">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {item.eyebrow}
                  </p>
                  <h3 className="mt-4 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
                <div className="mt-6 grid gap-3">
                  {item.points.map((point) => (
                    <div
                      key={point}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                    >
                      {point}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Solutions"
            title="Practical systems that move leads, bookings, and operations forward"
            description="Revanta AI focuses on business outcomes first, then builds the system that fits the workflow."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {solutions.map((item) => (
              <Card key={item.title} className="bg-white">
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
          <div className="panel bg-slate-50 p-7 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <span className="eyebrow">Industries</span>
                <h2 className="mt-5 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
                  Built for growing businesses that need speed, clarity, and better follow-up
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  Especially useful for service businesses and operations-heavy teams where lead
                  handling, booking, reporting, and internal coordination still rely on manual work.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {industries.map((industry) => (
                  <div
                    key={industry}
                    className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 text-sm font-medium text-slate-700"
                  >
                    {industry}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="How it works"
            title="A clear path from business problem to working system"
            description="Built for owners who want quick direction and a practical next step, not a slow sales process."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {conversionSteps.map((item) => (
              <Card key={item.step} className="bg-white">
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">
                  Step {item.step}
                </p>
                <h3 className="mt-4 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
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
          <div className="grid gap-6 lg:grid-cols-[0.98fr_1.02fr]">
            <Card className="relative overflow-hidden bg-white">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-slate-100 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3 text-slate-500">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 3l7 4v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V7l7-4z" />
                      <path d="M9.5 12.2l1.7 1.7 3.4-3.8" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em]">Founder-Led Execution</p>
                </div>

                <h2 className="mt-6 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
                  Why Revanta AI Exists
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  Many ambitious businesses have strong goals but settle for slow communication,
                  generic agency delivery, and systems that never truly fit how they operate.
                </p>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  Revanta AI was built to offer a better standard for companies that want serious
                  progress, not average work.
                </p>

                <div className="mt-8 grid gap-3">
                  {founderPrinciples.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-white"
                    >
                      <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900">
                        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4.5 10l3.2 3.2L15.5 5.5" />
                        </svg>
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-soft">
                  <p className="font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    Tharun Esta
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Founder, Revanta AI</p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {founderLinks.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-950"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </a>
                    ))}
                  </div>

                  <p className="mt-4 text-sm text-slate-500">
                    Active founder presence | Transparent communication | Building in public
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <div className="section-heading max-w-none">
                <span className="eyebrow">Founder-Led Execution</span>
                <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-slate-950 sm:text-4xl lg:text-5xl">
                  Built by a Founder Who Ships Real Products
                </h2>
                <p className="max-w-2xl text-base leading-8 text-slate-600">
                  Revanta AI is led by a founder actively building products, systems, and growth
                  assets, not just selling services.
                </p>
                <p className="max-w-2xl text-base leading-8 text-slate-600">
                  Current internal product work includes CareerForge, a live product concept
                  focused on career growth, and ForgeIDE, which is currently in the testing phase.
                </p>
                <p className="max-w-2xl text-base leading-8 text-slate-600">
                  This hands-on product building experience translates into sharper client
                  execution, better UX decisions, cleaner systems, and faster delivery.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {founderProofCards.map((card) => (
                  <Card key={card.title} className="bg-white transition duration-200 hover:-translate-y-0.5">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {card.title}
                    </p>
                    <div className="mt-4 grid gap-2">
                      {card.items.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/contact" className="button-primary">
                  Talk to Founder
                </Link>
                <Link href="/contact" className="button-secondary">
                  Request Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <div className="panel bg-slate-950 p-8 text-white sm:p-10 lg:p-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
                  Ready to move
                </p>
                <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                  Get a system that saves time, improves follow-up, and helps you close more business
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-300">
                  Request a quote if you already know the problem. Book a consultation if you want
                  help choosing the right solution first.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                  Get My Quote
                </Link>
                <Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  Book Consultation
                </Link>
                <Link href="/services" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  Explore Solutions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner />
    </main>
  );
}
