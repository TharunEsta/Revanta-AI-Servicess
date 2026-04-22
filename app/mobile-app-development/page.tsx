import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "Mobile App Development",
  description: serviceDetails["mobile-app-development"].summary,
  path: "/mobile-app-development",
  keywords: serviceDetails["mobile-app-development"].keywords
});

export default function MobileAppDevelopmentPage() {
  return <ServicePage slug="mobile-app-development" />;
}
