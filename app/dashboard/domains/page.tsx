import { buildMetadata } from "@/lib/seo";
import { Card, PageHero, SectionIntro } from "@/components/ui";

export const metadata = buildMetadata({
  title: "Domain Dashboard",
  description:
    "Manage domain status, expiry, connection, and renewal in one simple domain dashboard.",
  path: "/dashboard/domains",
  keywords: [
    "domain dashboard",
    "manage domains",
    "domain renewal dashboard",
    "domain status management"
  ]
});

const domains = [
  {
    name: "revantaai.com",
    status: "Active",
    expiry: "Renews on 12 March 2027",
    connection: "Connected to your live business system"
  },
  {
    name: "revantadomains.com",
    status: "Expiring Soon",
    expiry: "Expires on 28 June 2026",
    connection: "Connected and ready for renewal"
  },
  {
    name: "revantahealth.ai",
    status: "Connected",
    expiry: "Renews on 04 December 2026",
    connection: "Connected to web, email, and launch setup"
  }
];

const statusCopy = [
  {
    label: "Active",
    text: "Your domain is secure and working normally."
  },
  {
    label: "Expiring Soon",
    text: "Your domain needs attention soon to avoid interruption."
  },
  {
    label: "Connected",
    text: "Your domain is fully linked to the live setup."
  }
];

const actions = ["Manage", "Renew", "Connect"];

export default function DomainDashboardPage() {
  return (
    <main>
      <PageHero
        eyebrow="Revanta Domains"
        title="Manage your domains with clarity, control, and fewer moving parts"
        description="A simple dashboard for domain visibility, renewal timing, and connection status across your business setup."
      />

      <section className="section pt-8">
        <div className="shell">
          <Card>
            <SectionIntro
              eyebrow="Your domains"
              title="Domain list"
              description="See the essentials quickly so nothing important gets missed."
            />

            <div className="mt-10 grid gap-4">
              {domains.map((domain) => (
                <div
                  key={domain.name}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                        {domain.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">Status: {domain.status}</p>
                      <p className="mt-1 text-sm text-slate-600">{domain.expiry}</p>
                      <p className="mt-1 text-sm text-slate-600">{domain.connection}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {actions.map((action) => (
                        <button
                          key={`${domain.name}-${action}`}
                          type="button"
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell grid gap-6 lg:grid-cols-3">
          {statusCopy.map((item) => (
            <Card key={item.label}>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
              <p className="mt-4 text-sm leading-7 text-slate-600">{item.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <Card>
            <SectionIntro
              eyebrow="Renewal + alerts"
              title="Stay ahead of expiry without chasing renewal dates manually"
              description="Renewal is shown clearly so your team knows what is secure, what needs attention soon, and what is already protected with auto-renew."
            />

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
                <h3 className="text-xl font-semibold text-slate-950">Renewal reminders</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Get clear reminders before expiry so there is time to review and keep the domain
                  active without disruption.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
                <h3 className="text-xl font-semibold text-slate-950">Auto-renew protection</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Keep important business domains protected with automatic renewal for more
                  continuity and less manual oversight.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
