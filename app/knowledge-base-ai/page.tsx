import { ServiceSolutionPage } from "@/components/service-solution-page";
import { solutionPages } from "@/content/solution-pages";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: solutionPages["knowledge-base-ai"].metaTitle,
  description: solutionPages["knowledge-base-ai"].metaDescription,
  path: solutionPages["knowledge-base-ai"].path,
  keywords: solutionPages["knowledge-base-ai"].keywords
});

export default function KnowledgeBaseAiPage() {
  return <ServiceSolutionPage slug="knowledge-base-ai" />;
}
