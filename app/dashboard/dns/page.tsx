import { buildMetadata } from "@/lib/seo";
import { Card, PageHero, SectionIntro } from "@/components/ui";

export const metadata = buildMetadata({
  title: "DNS Management",
  description:
    "Manage DNS records, email setup, and verification settings with simple guidance built for business owners.",
  path: "/dashboard/dns",
  keywords: [
    "DNS management",
    "domain DNS settings",
    "email DNS setup",
    "domain verification settings"
  ]
});

const dnsSections = [
  {
    title: "A record",
    description:
      "This points your domain to the right website or system so visitors reach the correct destination.",
    tip: "Use this when you want your main domain to open your live website."
  },
  {
    title: "CNAME",
    description:
      "This connects one name to another, which is helpful for subdomains like www or app.",
    tip: "Use this when you want a subdomain to follow an existing connected address."
  },
  {
    title: "MX (email)",
    description:
      "This tells your domain where to send and receive business email so communication works properly.",
    tip: "Set this correctly before using your business email across the team."
  },
  {
    title: "TXT (verification)",
    description:
      "This helps confirm domain ownership and supports secure setup for email and other connected services.",
    tip: "Add this when you need to verify the domain or strengthen email trust."
  }
];

const emailGuides = [
  {
    title: "MX",
    description: "Direct your business email to the right inbox setup so incoming mail lands where it should."
  },
  {
    title: "SPF",
    description: "Help protect outgoing email reputation so your messages look more trustworthy."
  },
  {
    title: "DKIM",
    description: "Add an extra layer of confidence that your outgoing email is legitimate and correctly signed."
  }
];

const presets = [
  "Business email preset for fast, guided setup",
  "Website launch preset for cleaner domain connection",
  "Verification preset for secure domain confirmation"
];

export default function DnsManagementPage() {
  return (
    <main>
      <PageHero
        eyebrow="Revanta Domains"
        title="Manage DNS with simple guidance and cleaner business setup"
        description="DNS controls how your domain connects to your website, email, and important services. Revanta Domains makes that easier to understand and easier to manage."
      />

      <section className="section pt-8">
        <div className="shell">
          <Card>
            <SectionIntro
              eyebrow="DNS made simple"
              title="What DNS means in plain language"
              description="DNS is the connection layer that tells your domain where your website lives, where email should go, and how key parts of the setup work together."
            />

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {dnsSections.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                >
                  <h3 className="font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                  <p className="mt-4 text-sm font-medium text-slate-700">Tip: {item.tip}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <Card>
            <SectionIntro
              eyebrow="Email setup helper"
              title="Set up business email with clearer guidance"
              description="The email setup helper walks you through the records that matter most so your domain and business email work together properly."
            />

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {emailGuides.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                >
                  <h3 className="font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white p-6">
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                One-click presets
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                One-click presets apply the most common setup patterns for you, so instead of
                filling in every detail manually, you can choose a guided setup built for the goal
                you want.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {presets.map((preset) => (
                  <div
                    key={preset}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600"
                  >
                    {preset}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
