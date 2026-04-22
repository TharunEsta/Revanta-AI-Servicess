import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "MVP Development",
  description: serviceDetails["mvp-development"].summary,
  path: "/mvp-development",
  keywords: serviceDetails["mvp-development"].keywords
});

export default function MvpDevelopmentPage() {
  return <ServicePage slug="mvp-development" />;
}
