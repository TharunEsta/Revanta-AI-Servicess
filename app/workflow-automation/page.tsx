import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "Workflow Automation",
  description: serviceDetails["workflow-automation"].summary,
  path: "/workflow-automation",
  keywords: serviceDetails["workflow-automation"].keywords
});

export default function WorkflowAutomationPage() {
  return <ServicePage slug="workflow-automation" />;
}
