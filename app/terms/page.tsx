import { buildMetadata } from "@/lib/seo";
import { Card, PageHero } from "@/components/ui";

export const metadata = buildMetadata({
  title: "Terms of Service",
  description:
    "Revanta AI Terms of Service covering acceptance, service use, software development, AI automation, responsibilities, limitations, and contact information.",
  path: "/terms"
});

const company = {
  name: "Revanta AI",
  email: "hello@revantaai.com",
  website: "https://revantaai.com"
};

export default function TermsPage() {
  return (
    <main>
      <PageHero
        eyebrow="Terms of Service"
        title="Terms of Service"
        description="The rules for using Revanta AI’s services, including AI automation and software development offerings."
        primaryCta={{ label: "Contact Us", href: "/contact" }}
        secondaryCta={{ label: "Privacy Policy", href: "/privacy-policy" }}
      />

      <section className="section pt-8">
        <div className="shell">
          <Card>
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Acceptance of terms
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  By accessing or using our website, services, or software outputs, you agree
                  to these Terms of Service. If you do not agree, do not use the services.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Services description</h3>
                <p className="text-sm leading-7 text-slate-600">
                  Revanta AI provides AI automation and software development services, including:
                  AI Agents, WhatsApp automation, Voice AI, CRM/ERP development, SaaS platforms,
                  web applications, mobile applications, 3D websites, and IoT/hologram solutions.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">
                  Software development terms
                </h3>
                <p className="text-sm leading-7 text-slate-600">
                  Where Revanta AI develops software for customers, deliverables may include code,
                  configuration, and documentation. Unless otherwise agreed in writing, timelines
                  are estimates and depend on customer feedback, access to required information,
                  and third-party dependencies.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">AI automation usage</h3>
                <p className="text-sm leading-7 text-slate-600">
                  AI features may generate responses, suggestions, or workflows based on provided
                  data and prompts. You are responsible for reviewing and using outputs in a way
                  that fits your business needs and legal obligations.
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  You agree not to use our AI automation services to produce or distribute unlawful
                  content or to violate applicable laws, regulations, or platform rules.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">User responsibilities</h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
                  <li>Provide accurate information and necessary access for your project.</li>
                  <li>Use the services in compliance with applicable law.</li>
                  <li>Maintain the confidentiality of any credentials provided for accessing systems.</li>
                  <li>Ensure that data you share or submit is appropriate for the intended use.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Limitations</h3>
                <p className="text-sm leading-7 text-slate-600">
                  To the maximum extent permitted by law, Revanta AI is not liable for indirect,
                  incidental, special, consequential, or punitive damages arising from your use of
                  the services. We do not guarantee that the services will be uninterrupted or
                  error-free.
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  AI outputs may be inaccurate or incomplete. You should validate outputs before
                  acting on them.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Intellectual property</h3>
                <p className="text-sm leading-7 text-slate-600">
                  Revanta AI retains rights in its underlying technologies, tools, and components.
                  Where we deliver custom software, rights may depend on the engagement agreement.
                  You agree not to reverse engineer or misappropriate Revanta AI’s intellectual
                  property unless permitted by law or the governing agreement.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Service availability</h3>
                <p className="text-sm leading-7 text-slate-600">
                  We may modify, suspend, or discontinue parts of the services at any time, including
                  for maintenance, security, or operational reasons. We will not be responsible for any
                  loss caused by service changes unless required by law.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Contact information</h3>
                <p className="text-sm leading-7 text-slate-600">
                  If you have questions about these Terms of Service, contact:
                  <br />
                  <a className="link" href={`mailto:${company.email}`}>{company.email}</a>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}


