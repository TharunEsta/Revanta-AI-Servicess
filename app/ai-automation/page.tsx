import { CoreServicePage } from "@/components/core-service-page";
import { coreServicePages } from "@/content/core-services";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: coreServicePages["ai-automation"].metaTitle,
  description: coreServicePages["ai-automation"].metaDescription,
  path: coreServicePages["ai-automation"].path,
  keywords: coreServicePages["ai-automation"].keywords
});

export default function AiAutomationPage() {
  return <CoreServicePage slug="ai-automation" />;
}
