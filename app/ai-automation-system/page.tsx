import { ServiceSolutionPage } from "@/components/service-solution-page";
import { solutionPages } from "@/content/solution-pages";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: solutionPages["ai-automation-system"].metaTitle,
  description: solutionPages["ai-automation-system"].metaDescription,
  path: solutionPages["ai-automation-system"].path,
  keywords: solutionPages["ai-automation-system"].keywords
});

export default function AiAutomationSystemPage() {
  return <ServiceSolutionPage slug="ai-automation-system" />;
}
