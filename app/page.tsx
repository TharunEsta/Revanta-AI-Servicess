import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Card, CtaBanner, PageHero, SectionIntro } from "@/components/ui";
import { caseStudies } from "@/content/site";



export const metadata = buildMetadata({
  title: "Automate Bookings, Leads and Operations in Days",
  description:
    "Revanta AI builds custom websites, booking systems, AI automations, dashboards, and software that help growing businesses save time and increase revenue.",
  path: "/"
});

type BuildItem = {
  title: string;
  description: string;
};

const buildItems: BuildItem[] = [
  {
    title: "CRM systems",
    description:
      "Lead pipelines, conversation management, task tracking, and operational workflows built for real teams."
  },
  {
    title: "WhatsApp automation",
    description:
      "Automated intake, follow-ups, routing, and notifications to keep lead handling moving without manual delays."
  },
  {
    title: "Lead management",
    description:
      "Structured lead capture, assignment, stage tracking, and follow-up discipline across channels."
  },
  {
    title: "Internal dashboards",
    description:
      "Reporting views for leads, projects, workflows, and operational performance with clear ownership and visibility."
  },
  {
    title: "AI workflows",
    description:
      "AI-assisted operations for drafting, summarization, qualification, and internal decision support."
  },
  {
    title: "Booking systems",
    description:
      "Operational booking flows connected to CRM, reminders, and follow-up sequences."
  }
];


const founderPrinciples = [
  "Built from operational needs",
  "Run workflows in production",
  "Keep systems maintainable",
  "Ship with clarity and speed"
];


// Social links removed from homepage to keep the page product-first and credibility-focused.


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
      {/* Lead with an operational message; keep page lightweight and product-first. */}
      <PageHero

        eyebrow="Revanta AI"
        title="We build and operate CRM, automation and business systems"
        description="Revanta AI runs operational software: CRM systems, WhatsApp automation, internal dashboards, AI workflows, and booking flows."
        primaryCta={{ label: "Book Consultation", href: "/contact" }}
        secondaryCta={{ label: "View Our Platform", href: "/revanta-os" }}
      />





      <section className="section pb-10 pt-10">
        <div className="shell">
          <SectionIntro
            eyebrow="Software We Build and Operate"
            title="CRM Systems, WhatsApp Automation, Internal Dashboards, AI Workflows"
            description="Operating systems for lead tracking, communication workflows, reporting, and process automation."
          />


          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {buildItems.map((item) => (
              <Card key={item.title} className="bg-white transition duration-200 hover:-translate-y-0.5">
                <h3 className="font-[var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>

                <div className="mt-6 space-y-2">
                    {item.title === "CRM systems" ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      Lead tracking, customer records, sales pipeline management.
                    </div>
                  ) : null}


                  {item.title === "WhatsApp automation" ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      Lead capture, automated follow-up, team inbox workflows.
                    </div>
                  ) : null}

                  {item.title === "Internal dashboards" ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      Operational visibility, reporting, workflow management.
                    </div>
                  ) : null}

                  {item.title === "AI workflows" ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      AI assistants, knowledge retrieval, process automation.
                    </div>
                  ) : null}

                  {item.title === "Booking systems" ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      Scheduling, appointment management, customer booking flows.
                    </div>
                  ) : null}

                  {item.title === "Lead management" ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      Lead capture, assignment, stage tracking, and follow-up discipline.
                    </div>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>




      <section className="section pb-10 pt-10">
        <div className="shell">
          <SectionIntro
            eyebrow="Technology Stack"
            title="Technology Stack"
            description="Operating-grade software stack used across Revanta systems."
            align="left"
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "PostgreSQL",
              "React",
              "Next.js",
              "Node.js",
              "Docker",
              "OpenAI",
              "Anthropic",
              "Google Cloud",
              "GitHub"
            ].map((t) => (
              <div
                key={t}
                className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 text-sm font-medium text-slate-700 transition duration-200 hover:bg-slate-50"
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-10">
        <div className="shell">
          <div className="panel bg-white p-7 sm:p-10">
            <div className="space-y-4">
              <span className="eyebrow">Built From Real Operational Needs</span>
              <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
                Built From Real Operational Needs
              </h2>
              <p className="max-w-3xl text-base leading-8 text-slate-600">
                Revanta AI started after building internal systems to manage leads, communication, follow-up and operations more effectively.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section pb-10 pt-10">

        <div className="shell">
          <div className="panel bg-white p-7 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div>
                <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                  Ready to Build Software That Runs Your Business?
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
                  Discuss your workflow, operations or automation requirements with the Revanta AI team.
                </p>

                <div className="mt-7 grid gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <div className="font-semibold text-slate-900">Phone</div>
                    <div className="mt-1">+91 90147 19422</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <div className="font-semibold text-slate-900">WhatsApp</div>
                    <div className="mt-1">+91 90147 19422</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <div className="font-semibold text-slate-900">Email</div>
                    <div className="mt-1">
                      <a href="mailto:hello@revantaai.com" className="text-slate-950 hover:underline">
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
        </div>
      </section>

    </main>
  );
}
