import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "Custom Software",
  description: serviceDetails["custom-software"].summary,
  path: "/custom-software",
  keywords: serviceDetails["custom-software"].keywords
});

export default function CustomSoftwarePage() {
  return <ServicePage slug="custom-software" />;
}
