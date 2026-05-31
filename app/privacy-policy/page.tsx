import { buildMetadata } from "@/lib/seo";
import { Card, PageHero } from "@/components/ui";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "Revanta AI privacy policy for how we collect and use data, including WhatsApp user data processing and user rights.",
  path: "/privacy-policy"
});

const company = {
  name: "Revanta AI",
  email: "hello@revantaai.com",
  website: "https://revantaai.com"
};

export default function PrivacyPolicyPage() {
  return (
    <main>
      <PageHero
        eyebrow="Privacy Policy"
        title="Privacy Policy"
        description="How Revanta AI collects, uses, stores, and protects information—especially data processed through our WhatsApp automation and AI systems."
        primaryCta={{ label: "Contact Us", href: "/contact" }}
        secondaryCta={{ label: "Data Deletion", href: "/data-deletion" }}
      />

      <section className="section pt-8">
        <div className="shell">
          <Card>
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Overview
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Revanta AI (“we”, “us”, “our”) is an AI Automation and Software Development Company.
                  This Privacy Policy explains what information we collect, how we use it, and the
                  choices you have.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Information we collect</h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
                  <li>
                    <span className="font-medium text-slate-900">Contact and identity details:</span>{" "}
                    name, email address, phone number, and business contact information you provide.
                  </li>
                  <li>
                    <span className="font-medium text-slate-900">Customer and lead data:</span>{" "}
                    information you submit through web forms, conversations, and other interactions.
                  </li>
                  <li>
                    <span className="font-medium text-slate-900">Messages and conversation content:</span>{" "}
                    WhatsApp conversations and related metadata where you engage with our services.
                  </li>
                  <li>
                    <span className="font-medium text-slate-900">Technical and usage data:</span>{" "}
                    logs, device/browser information, and interaction events collected by hosting and
                    analytics services.
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">WhatsApp user data usage</h3>
                <p className="text-sm leading-7 text-slate-600">
                  When you interact with businesses using Revanta AI’s WhatsApp automation (for example,
                  booking, lead capture, support, and follow-up), we may process WhatsApp user data
                  to deliver automated and AI-assisted responses, route messages, and manage conversation
                  flows.
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  This can include message content and related metadata, such as timestamps and
                  conversation identifiers, needed to provide and operate the service.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Customer messages</h3>
                <p className="text-sm leading-7 text-slate-600">
                  We process customer messages to:
                </p>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
                  <li>Respond to inquiries and requests</li>
                  <li>Provide automated support and follow-up</li>
                  <li>Route messages to the appropriate workflow, system, or team</li>
                  <li>Improve conversation quality through internal review and optimization</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Contact information</h3>
                <p className="text-sm leading-7 text-slate-600">
                  We use contact information to reply to your messages, provide service-related
                  communications, and support your requests.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Business communication data</h3>
                <p className="text-sm leading-7 text-slate-600">
                  We may collect and store communication data related to business inquiries, project
                  discussions, and service delivery, including emails and communications you exchange
                  with us.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">How AI systems process data</h3>
                <p className="text-sm leading-7 text-slate-600">
                  Our AI systems may analyze message content and related context to generate responses,
                  extract intent, classify requests, summarize conversations, and assist with workflow
                  decisions.
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  We design AI-assisted workflows to support user requests and service delivery. In
                  some cases, we may also involve human review for quality assurance and safety.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Data storage</h3>
                <p className="text-sm leading-7 text-slate-600">
                  We store data for as long as needed to provide our services, meet legal obligations,
                  resolve disputes, and enforce agreements. Storage may include systems and databases
                  used by our hosting and service providers.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Security practices</h3>
                <p className="text-sm leading-7 text-slate-600">
                  We implement administrative, technical, and physical safeguards designed to protect
                  personal data. No method of transmission or storage is completely secure, but we
                  maintain reasonable safeguards to reduce risk.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Third party services</h3>
                <p className="text-sm leading-7 text-slate-600">
                  We may use the following third-party services to operate and deliver our WhatsApp
                  automation, AI-assisted features, and hosting infrastructure:
                </p>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
                  <li>
                    <span className="font-medium text-slate-900">Meta WhatsApp Cloud API:</span>{" "}
                    used to send and receive WhatsApp messages and to support messaging workflows.
                  </li>
                  <li>
                    <span className="font-medium text-slate-900">AI providers:</span>{" "}
                    used to run AI models that help process or generate responses.
                  </li>
                  <li>
                    <span className="font-medium text-slate-900">Hosting providers:</span>{" "}
                    used to store and run our applications, databases, and supporting services.
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">We do not sell personal data</h3>
                <p className="text-sm leading-7 text-slate-600">
                  Revanta AI does not sell personal data.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">User rights</h3>
                <p className="text-sm leading-7 text-slate-600">
                  Depending on your location, you may have rights related to your personal data. These
                  can include rights to access, correct, delete, or object to certain processing, and
                  rights to request information about how data is used.
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  To exercise your rights, contact us at <a className="link" href={`mailto:${company.email}`}>{company.email}</a>.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Contact information</h3>
                <p className="text-sm leading-7 text-slate-600">
                  Revanta AI<br />
                  Email: <a className="link" href={`mailto:${company.email}`}>{company.email}</a><br />
                  Website: <a className="link" href={company.website}>{company.website}</a>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

