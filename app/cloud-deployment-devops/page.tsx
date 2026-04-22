import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "Cloud Deployment / DevOps",
  description: serviceDetails["cloud-deployment-devops"].summary,
  path: "/cloud-deployment-devops",
  keywords: serviceDetails["cloud-deployment-devops"].keywords
});

export default function CloudDeploymentDevopsPage() {
  return <ServicePage slug="cloud-deployment-devops" />;
}
