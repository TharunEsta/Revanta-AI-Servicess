import { ServiceSolutionPage } from "@/components/service-solution-page";
import { solutionPages } from "@/content/solution-pages";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: solutionPages["document-processing-ai"].metaTitle,
  description: solutionPages["document-processing-ai"].metaDescription,
  path: solutionPages["document-processing-ai"].path,
  keywords: solutionPages["document-processing-ai"].keywords
});

export default function DocumentProcessingAiPage() {
  return <ServiceSolutionPage slug="document-processing-ai" />;
}
