import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "Technology Consulting",
  description: serviceDetails["technology-consulting"].summary,
  path: "/technology-consulting",
  keywords: serviceDetails["technology-consulting"].keywords
});

export default function TechnologyConsultingPage() {
  return <ServicePage slug="technology-consulting" />;
}
