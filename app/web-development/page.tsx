import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "Web Development",
  description: serviceDetails["web-development"].summary,
  path: "/web-development",
  keywords: serviceDetails["web-development"].keywords
});

export default function WebDevelopmentPage() {
  return <ServicePage slug="web-development" />;
}
