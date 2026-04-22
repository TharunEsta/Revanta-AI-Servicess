import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "AI Automation",
  description: serviceDetails["ai-automation"].summary,
  path: "/ai-automation",
  keywords: serviceDetails["ai-automation"].keywords
});

export default function AiAutomationPage() {
  return <ServicePage slug="ai-automation" />;
}
