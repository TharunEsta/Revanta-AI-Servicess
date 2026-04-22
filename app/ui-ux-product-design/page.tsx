import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "UI/UX Product Design",
  description: serviceDetails["ui-ux-product-design"].summary,
  path: "/ui-ux-product-design",
  keywords: serviceDetails["ui-ux-product-design"].keywords
});

export default function UiUxProductDesignPage() {
  return <ServicePage slug="ui-ux-product-design" />;
}
