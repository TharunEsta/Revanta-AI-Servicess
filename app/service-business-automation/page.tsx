import { ServiceSolutionPage } from "@/components/service-solution-page";
import { solutionPages } from "@/content/solution-pages";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: solutionPages["service-business-automation"].metaTitle,
  description: solutionPages["service-business-automation"].metaDescription,
  path: solutionPages["service-business-automation"].path,
  keywords: solutionPages["service-business-automation"].keywords
});

export default function ServiceBusinessAutomationPage() {
  return <ServiceSolutionPage slug="service-business-automation" />;
}
