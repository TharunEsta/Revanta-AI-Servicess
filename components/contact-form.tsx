import { BusinessForm } from "@/components/business-form";

export function ContactForm() {
  return (
    <BusinessForm
      formType="contact"
      title="Project Inquiry"
      description="Share your goals, scope, and timeline. Revanta AI will review the project and respond with the clearest next step."
      submitLabel="Submit Inquiry"
      fields={[
        { name: "name", label: "Full Name", type: "text", placeholder: "Your full name", required: true },
        {
          name: "email",
          label: "Work Email",
          type: "email",
          placeholder: "you@company.com",
          required: true
        },
        { name: "company", label: "Company", type: "text", placeholder: "Company name", required: true },
        { name: "phone", label: "Phone", type: "tel", placeholder: "+91 90000 00000" },
        {
          name: "service",
          label: "Service Needed",
          type: "select",
          options: [
            { label: "AI Automation", value: "AI Automation" },
            { label: "SaaS Development", value: "SaaS Development" },
            { label: "MVP Development", value: "MVP Development" },
            { label: "Mobile App Development", value: "Mobile App Development" },
            { label: "Web Development", value: "Web Development" },
            { label: "Custom Software", value: "Custom Software" },
            { label: "CRM / ERP Solutions", value: "CRM / ERP Solutions" }
          ],
          required: true
        },
        {
          name: "budget",
          label: "Budget Range",
          type: "select",
          options: [
            { label: "Prefer to discuss", value: "Prefer to discuss" },
            { label: "INR 1L - INR 3L", value: "INR 1L - INR 3L" },
            { label: "INR 3L - INR 5L", value: "INR 3L - INR 5L" },
            { label: "INR 5L - INR 10L", value: "INR 5L - INR 10L" },
            { label: "INR 10L+", value: "INR 10L+" }
          ]
        },
        {
          name: "timeline",
          label: "Timeline",
          type: "text",
          placeholder: "Example: 2-4 weeks or flexible"
        },
        {
          name: "message",
          label: "Project Brief",
          type: "textarea",
          placeholder:
            "Tell us what you want to build, the business goal behind it, and any important requirements.",
          required: true,
          rows: 6
        }
      ]}
    />
  );
}
