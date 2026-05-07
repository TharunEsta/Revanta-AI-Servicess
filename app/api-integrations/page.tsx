import { CoreServicePage } from "@/components/core-service-page";
import { coreServicePages } from "@/content/core-services";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: coreServicePages["api-integrations"].metaTitle,
  description: coreServicePages["api-integrations"].metaDescription,
  path: coreServicePages["api-integrations"].path,
  keywords: coreServicePages["api-integrations"].keywords
});

export default function ApiIntegrationsPage() {
  return <CoreServicePage slug="api-integrations" />;
}
