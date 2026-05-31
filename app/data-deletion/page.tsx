import { buildMetadata } from "@/lib/seo";
import { Card, PageHero } from "@/components/ui";

export const metadata = buildMetadata({
  title: "Data Deletion Instructions",
  description:
    "Instructions for requesting deletion of your data from Revanta AI, including WhatsApp-related data processed for automation.",
  path: "/data-deletion"
});

const company = {
  name: "Revanta AI",
  email: "hello@revantaai.com",
  website: "https://revantaai.com"
};

export default function DataDeletionPage() {
  return (
    <main>
      <PageHero
        eyebrow="Data Deletion"
        title="User Data Deletion Instructions"
        description="Request deletion of applicable user data. We will verify your request and delete relevant information where possible."
        primaryCta={{ label: "Email Us", href: `mailto:${company.email}` }}
        secondaryCta={{ label: "Privacy Policy", href: "/privacy-policy" }}
      />

      <section className="section pt-8">
        <div className="shell">
          <Card>
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Request deletion of your data
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Users can request deletion of their personal data processed by Revanta AI,
                  including data related to WhatsApp automation and AI-assisted workflows.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Steps</h3>

                <ol className="mt-2 list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-600">
                  <li>
                    <span className="font-medium text-slate-900">Email</span>{" "}
                    <a className="link" href={`mailto:${company.email}`}>{company.email}</a>.
                  </li>
                  <li>
                    <span className="font-medium text-slate-900">Subject:</span>{" "}
                    <span className="font-mono">Data Deletion Request</span>
                  </li>
                  <li>
                    <span className="font-medium text-slate-900">Include</span>{" "}
                    your WhatsApp number and/or email address you used to engage with the services.
                  </li>
                  <li>
                    Revanta AI will verify your request and delete applicable user data where
                    permitted by law and operational requirements.
                  </li>
                </ol>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">What to include in your email</h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
                  <li>Your request is for data deletion related to Revanta AI services.</li>
                  <li>WhatsApp number/email used in conversations (if applicable).</li>
                  <li>Any identifiers that help us locate your records (for example, approximate
                    dates of messages).</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Verification and timelines</h3>
                <p className="text-sm leading-7 text-slate-600">
                  To protect your privacy, we may need to verify that your request is legitimate
                  before acting. After verification, we will take reasonable steps to delete
                  applicable data, considering legal obligations and safety/security requirements.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-950">Contact information</h3>
                <p className="text-sm leading-7 text-slate-600">
                  If you have questions about this process, email us at:{" "}
                  <a className="link" href={`mailto:${company.email}`}>{company.email}</a>.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

