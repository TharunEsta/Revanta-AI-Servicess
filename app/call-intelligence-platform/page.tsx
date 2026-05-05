import { ServiceSolutionPage } from "@/components/service-solution-page";
import { solutionPages } from "@/content/solution-pages";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: solutionPages["call-intelligence-platform"].metaTitle,
  description: solutionPages["call-intelligence-platform"].metaDescription,
  path: solutionPages["call-intelligence-platform"].path,
  keywords: solutionPages["call-intelligence-platform"].keywords
});

export default function CallIntelligencePlatformPage() {
  return <ServiceSolutionPage slug="call-intelligence-platform" />;
}
