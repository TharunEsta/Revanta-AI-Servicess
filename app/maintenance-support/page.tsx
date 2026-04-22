import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "Maintenance & Support",
  description: serviceDetails["maintenance-support"].summary,
  path: "/maintenance-support",
  keywords: serviceDetails["maintenance-support"].keywords
});

export default function MaintenanceSupportPage() {
  return <ServicePage slug="maintenance-support" />;
}
