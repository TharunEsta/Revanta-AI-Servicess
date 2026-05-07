import { CoreServicePage } from "@/components/core-service-page";
import { coreServicePages } from "@/content/core-services";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: coreServicePages["custom-software"].metaTitle,
  description: coreServicePages["custom-software"].metaDescription,
  path: coreServicePages["custom-software"].path,
  keywords: coreServicePages["custom-software"].keywords
});

export default function CustomSoftwarePage() {
  return <CoreServicePage slug="custom-software" />;
}
