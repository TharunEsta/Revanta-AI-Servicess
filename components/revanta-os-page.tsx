import Link from "next/link";
import { buildMetadata, softwareApplicationSchema } from "@/lib/seo";
import {
  industryTemplates,
  platformModules,
  platformPrinciples,
  workflowBlueprints
} from "@/content/revanta-os";
import { Card, CtaBanner, PageHero, SectionIntro } from "@/components/ui";
import { StructuredData } from "@/components/structured-data";

export const metadata = buildMetadata({
  title: "Revanta OS",
  description:
    "Revanta OS is Revanta AI's operating system for CRM, ERP, WhatsApp automation, AI workflows, multi-tenant SaaS operations, and execution.",
  path: "/revanta-os",
  keywords: ["Revanta OS", "AI business operating system", "WhatsApp automation platform"]
});

const stackHighlights = [
  "Next.js UI shell",
  "Node.js API layer",
  "PostgreSQL system of record",
  "Prisma schema discipline",
  "N8N workflow orchestration",
  "WhatsApp Cloud API",
  "AI provider abstraction",
  "Tenant-aware security"
];

export function RevantaOsPage() {
  return (
    <main>
      <StructuredData
        data={softwareApplicationSchema(
          "Revanta OS",
          "AI-powered business operating system for CRM, ERP, WhatsApp automation, AI agents, and multi-tenant operations.",
          "/revanta-os"
        )}
      />

      <PageHero
        eyebrow="Revanta OS"
        title="The operating system for sales, support, delivery, and automation."
        description="Revanta OS combines CRM, ERP, WhatsApp automation, AI agents, lead management, customer operations, analytics, and multi-tenant SaaS controls into one execution layer."
        primaryCta={{ label: "Book a Strategy Call", href: "/contact" }}
        secondaryCta={{ label: "View Services", href: "/services" }}
      />

      <section className="section pt-0">
        <div className="shell grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stackHighlights.map((item) => (
            <Card key={item} className="bg-white">
              <p className="text-sm font-medium text-slate-700">{item}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Operating principles"
            title="Built as one product, not a pile of disconnected tools."
            description="The architecture is intentionally modular, tenant-aware, and operationally dense so teams can move fast without losing control."
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {platformPrinciples.map((principle) => (
              <Card key={principle} className="bg-white">
                <p className="text-sm leading-7 text-slate-600">{principle}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Core modules"
            title="Production-grade systems that cover the full operating loop."
            description="Each module is designed around a clear architecture layer, storage shape, API surface, UI pattern, automation boundary, security model, and deployment responsibility."
          />

          <div className="mt-10 grid gap-6 xl:grid-cols-2">
            {platformModules.map((module) => (
              <Card key={module.name} className="bg-white">
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Module</p>
                  <h2 className="font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {module.name}
                  </h2>
                  <p className="text-sm leading-7 text-slate-600">{module.summary}</p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Architecture
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{module.architecture}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Database
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{module.database}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      API Design
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{module.api}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Frontend
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{module.frontend}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Automation
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{module.automation}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Security / Deployment
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {module.security} {module.deployment}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Workflow center"
            title="The operating loops that make the system useful every day."
            description="These workflows are the core execution patterns for sales, support, and follow-up."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {workflowBlueprints.map((workflow) => (
              <Card key={workflow.title} className="bg-white">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{workflow.title}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {workflow.steps.map((step, index) => (
                    <span
                      key={step}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                        {index + 1}
                      </span>
                      {step}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-600">{workflow.outcome}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Industry templates"
            title="Start with a template, then tune it to the business."
            description="Each template keeps the core product intact while adjusting workflow stages, dashboards, automations, KPIs, and CRM fields for the vertical."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {industryTemplates.map((industry) => (
              <Card key={industry.name} className="bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Template</p>
                    <h2 className="mt-3 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      {industry.name}
                    </h2>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    V1
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Workflows
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {industry.workflows.map((item) => (
                        <span key={item} className="rounded-full bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Dashboards
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {industry.dashboards.map((item) => (
                        <span key={item} className="rounded-full bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Automations
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {industry.automations.map((item) => (
                        <span key={item} className="rounded-full bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      KPIs
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {industry.kpis.map((item) => (
                        <span key={item} className="rounded-full bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    CRM customizations
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {industry.crmCustomizations.map((item) => (
                      <span key={item} className="rounded-full bg-white px-3 py-2 text-sm text-slate-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="bg-white">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Deployment design</p>
            <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
              Practical infrastructure, not overbuilt infrastructure.
            </h2>
            <div className="mt-6 grid gap-3">
              {[
                "Google Cloud VM hosting behind Nginx",
                "PM2 process supervision for Node services",
                "Docker for repeatable local and production builds",
                "Environment configuration separated from source control",
                "Webhook retries, idempotency, and job queues",
                "PostgreSQL as the durable system of record"
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-white">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Security design</p>
            <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
              Tenant isolation, provider control, and auditable execution.
            </h2>
            <div className="mt-6 grid gap-3">
              {[
                "Server-side permission checks on every business action",
                "Tenant IDs required on all operational tables",
                "Signed webhook validation for WhatsApp and billing events",
                "Role-based visibility for operators, managers, and admins",
                "Audit logs for workflow changes and system actions",
                "Credential storage kept off the client and out of UI state"
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <Card className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Build direction</p>
              <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                Revanta OS becomes the system operators use to discover, convert, and manage work.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                The code structure is organized to support CRM, ERP, WhatsApp, AI, billing, and
                team operations without turning into a fragmented app collection.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="button-primary">
                Discuss Revanta OS
              </Link>
              <Link href="/services" className="button-secondary">
                Explore Services
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <CtaBanner />
    </main>
  );
}
