import { ServiceSolutionPage } from "@/components/service-solution-page";
import { solutionPages } from "@/content/solution-pages";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: solutionPages["lead-follow-up-automation"].metaTitle,
  description: solutionPages["lead-follow-up-automation"].metaDescription,
  path: solutionPages["lead-follow-up-automation"].path,
  keywords: solutionPages["lead-follow-up-automation"].keywords
});

export default function LeadFollowUpAutomationPage() {
  return <ServiceSolutionPage slug="lead-follow-up-automation" />;
}
