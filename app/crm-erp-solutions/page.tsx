import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "CRM ERP Solutions",
  description: serviceDetails["crm-erp-solutions"].summary,
  path: "/crm-erp-solutions",
  keywords: serviceDetails["crm-erp-solutions"].keywords
});

export default function CrmErpSolutionsPage() {
  return <ServicePage slug="crm-erp-solutions" />;
}
