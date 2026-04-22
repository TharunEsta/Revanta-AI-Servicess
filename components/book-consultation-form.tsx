import { BusinessForm } from "@/components/business-form";

export function BookConsultationForm() {
  return (
    <BusinessForm
      formType="bookConsultation"
      title="Book Consultation"
      description="Schedule a focused conversation about your goals, technical direction, and the best next step."
      submitLabel="Book Consultation"
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
        { name: "phone", label: "Phone", type: "tel", placeholder: "+91 90000 00000" },
        {
          name: "service",
          label: "Service Interest",
          type: "select",
          options: [
            { label: "AI Automation", value: "AI Automation" },
            { label: "SaaS Development", value: "SaaS Development" },
            { label: "MVP Development", value: "MVP Development" },
            { label: "Web Development", value: "Web Development" },
            { label: "Custom Software", value: "Custom Software" }
          ]
        },
        {
          name: "budget",
          label: "Budget Range",
          type: "select",
          options: [
            { label: "INR 1L - INR 3L", value: "INR 1L - INR 3L" },
            { label: "INR 3L - INR 5L", value: "INR 3L - INR 5L" },
            { label: "INR 5L - INR 10L", value: "INR 5L - INR 10L" },
            { label: "INR 10L+", value: "INR 10L+" }
          ]
        },
        {
          name: "preferredTime",
          label: "Preferred Time",
          type: "text",
          placeholder: "Example: Weekdays after 3 PM IST"
        },
        {
          name: "goals",
          label: "Consultation Goals",
          type: "textarea",
          placeholder: "Tell us what you want to discuss, the current challenge, and what success looks like.",
          required: true,
          rows: 6
        }
      ]}
    />
  );
}
