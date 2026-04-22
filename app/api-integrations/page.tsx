import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "API Integrations",
  description: serviceDetails["api-integrations"].summary,
  path: "/api-integrations",
  keywords: serviceDetails["api-integrations"].keywords
});

export default function ApiIntegrationsPage() {
  return <ServicePage slug="api-integrations" />;
}
