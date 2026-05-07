import { CoreServicePage } from "@/components/core-service-page";
import { coreServicePages } from "@/content/core-services";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: coreServicePages["web-mobile-development"].metaTitle,
  description: coreServicePages["web-mobile-development"].metaDescription,
  path: coreServicePages["web-mobile-development"].path,
  keywords: coreServicePages["web-mobile-development"].keywords
});

export default function WebMobileDevelopmentPage() {
  return <CoreServicePage slug="web-mobile-development" />;
}
