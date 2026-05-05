import { ServiceSolutionPage } from "@/components/service-solution-page";
import { solutionPages } from "@/content/solution-pages";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: solutionPages["custom-software-development"].metaTitle,
  description: solutionPages["custom-software-development"].metaDescription,
  path: solutionPages["custom-software-development"].path,
  keywords: solutionPages["custom-software-development"].keywords
});

export default function CustomSoftwareDevelopmentPage() {
  return <ServiceSolutionPage slug="custom-software-development" />;
}
