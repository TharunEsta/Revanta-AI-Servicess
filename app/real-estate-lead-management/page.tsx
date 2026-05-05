import { ServiceSolutionPage } from "@/components/service-solution-page";
import { solutionPages } from "@/content/solution-pages";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: solutionPages["real-estate-lead-management"].metaTitle,
  description: solutionPages["real-estate-lead-management"].metaDescription,
  path: solutionPages["real-estate-lead-management"].path,
  keywords: solutionPages["real-estate-lead-management"].keywords
});

export default function RealEstateLeadManagementPage() {
  return <ServiceSolutionPage slug="real-estate-lead-management" />;
}
