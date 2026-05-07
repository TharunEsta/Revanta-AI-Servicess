import { CoreServicePage } from "@/components/core-service-page";
import { coreServicePages } from "@/content/core-services";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: coreServicePages["crm-systems"].metaTitle,
  description: coreServicePages["crm-systems"].metaDescription,
  path: coreServicePages["crm-systems"].path,
  keywords: coreServicePages["crm-systems"].keywords
});

export default function CrmSystemsPage() {
  return <CoreServicePage slug="crm-systems" />;
}
