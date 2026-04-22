import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "SaaS Development",
  description: serviceDetails["saas-development"].summary,
  path: "/saas-development",
  keywords: serviceDetails["saas-development"].keywords
});

export default function SaasDevelopmentPage() {
  return <ServicePage slug="saas-development" />;
}
