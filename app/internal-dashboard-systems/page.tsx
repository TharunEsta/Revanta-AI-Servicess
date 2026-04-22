import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "Internal Dashboard Systems",
  description: serviceDetails["internal-dashboard-systems"].summary,
  path: "/internal-dashboard-systems",
  keywords: serviceDetails["internal-dashboard-systems"].keywords
});

export default function InternalDashboardSystemsPage() {
  return <ServicePage slug="internal-dashboard-systems" />;
}
