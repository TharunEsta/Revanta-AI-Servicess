import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "E-commerce Development",
  description: serviceDetails["e-commerce-development"].summary,
  path: "/e-commerce-development",
  keywords: serviceDetails["e-commerce-development"].keywords
});

export default function EcommerceDevelopmentPage() {
  return <ServicePage slug="e-commerce-development" />;
}
