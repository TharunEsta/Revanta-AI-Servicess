import { ServiceSolutionPage } from "@/components/service-solution-page";
import { solutionPages } from "@/content/solution-pages";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: solutionPages["crm-erp-system"].metaTitle,
  description: solutionPages["crm-erp-system"].metaDescription,
  path: solutionPages["crm-erp-system"].path,
  keywords: solutionPages["crm-erp-system"].keywords
});

export default function CrmErpSystemPage() {
  return <ServiceSolutionPage slug="crm-erp-system" />;
}
