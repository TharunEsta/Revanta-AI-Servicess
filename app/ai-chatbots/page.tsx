import { buildMetadata } from "@/lib/seo";
import { serviceDetails } from "@/content/site";
import { ServicePage } from "@/components/service-page";

export const metadata = buildMetadata({
  title: "AI Chatbots",
  description: serviceDetails["ai-chatbots"].summary,
  path: "/ai-chatbots",
  keywords: serviceDetails["ai-chatbots"].keywords
});

export default function AiChatbotsPage() {
  return <ServicePage slug="ai-chatbots" />;
}
