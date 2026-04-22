import { BusinessForm } from "@/components/business-form";

export function QuoteRequestForm() {
  return (
    <BusinessForm
      formType="quoteRequest"
      title="Quote Request"
      description="Share the business context, scope, and timeline so Revanta AI can review your project properly."
      submitLabel="Request a Quote"
      fields={[
        { name: "name", label: "Full Name", type: "text", placeholder: "Your full name", required: true },
        {
          name: "email",
          label: "Work Email",
          type: "email",
          placeholder: "you@company.com",
          required: true
        },
        { name: "company", label: "Company", type: "text", placeholder: "Company name" },
        { name: "industry", label: "Industry", type: "text", placeholder: "Healthcare, SaaS, E-commerce" },
        {
          name: "projectType",
          label: "Project Type",
          type: "select",
          options: [
            { label: "Website Build", value: "Website Build" },
            { label: "Automation System", value: "Automation System" },
            { label: "SaaS Product", value: "SaaS Product" },
            { label: "Mobile App", value: "Mobile App" },
            { label: "Custom Software", value: "Custom Software" }
          ],
          required: true
        },
        {
          name: "budget",
          label: "Budget Direction",
          type: "select",
          options: [
            { label: "INR 1L - INR 3L", value: "INR 1L - INR 3L" },
            { label: "INR 3L - INR 5L", value: "INR 3L - INR 5L" },
            { label: "INR 5L - INR 10L", value: "INR 5L - INR 10L" },
            { label: "INR 10L+", value: "INR 10L+" }
          ]
        },
        {
          name: "timeline",
          label: "Expected Timeline",
          type: "text",
          placeholder: "Example: 4-6 weeks"
        },
        {
          name: "requirements",
          label: "Main Requirements",
          type: "textarea",
          placeholder: "Describe the key features, business goals, and what the project needs to achieve.",
          required: true,
          rows: 6
        },
        {
          name: "aiOpportunities",
          label: "AI / Automation Opportunities",
          type: "textarea",
          placeholder: "Share any automation, chatbot, reporting, or workflow opportunities you want explored.",
          rows: 5
        }
      ]}
    />
  );
}
