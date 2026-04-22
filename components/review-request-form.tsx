import { BusinessForm } from "@/components/business-form";

export function ReviewRequestForm() {
  return (
    <BusinessForm
      formType="reviewRequest"
      title="Future Review Request"
      description="Use this form after a completed project when you want Revanta AI to follow up for client feedback or a testimonial request."
      submitLabel="Send Review Request"
      fields={[
        { name: "name", label: "Full Name", type: "text", placeholder: "Your full name", required: true },
        {
          name: "email",
          label: "Email",
          type: "email",
          placeholder: "you@company.com",
          required: true
        },
        { name: "company", label: "Company", type: "text", placeholder: "Company name" },
        { name: "role", label: "Role / Position", type: "text", placeholder: "Founder, Manager, Team Lead" },
        {
          name: "completedService",
          label: "Completed Service",
          type: "select",
          options: [
            { label: "AI Automation", value: "AI Automation" },
            { label: "SaaS Development", value: "SaaS Development" },
            { label: "Mobile App Development", value: "Mobile App Development" },
            { label: "Web Development", value: "Web Development" },
            { label: "Custom Software", value: "Custom Software" }
          ]
        },
        {
          name: "projectName",
          label: "Project Name",
          type: "text",
          placeholder: "Example: Clinic workflow automation rollout",
          required: true
        },
        {
          name: "reviewNotes",
          label: "Additional Notes",
          type: "textarea",
          placeholder: "Add context about the project completion, expected follow-up, or testimonial timing.",
          rows: 6
        }
      ]}
    />
  );
}
