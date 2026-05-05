import { ServiceSolutionPage } from "@/components/service-solution-page";
import { solutionPages } from "@/content/solution-pages";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: solutionPages["voice-ai-calling-system"].metaTitle,
  description: solutionPages["voice-ai-calling-system"].metaDescription,
  path: solutionPages["voice-ai-calling-system"].path,
  keywords: solutionPages["voice-ai-calling-system"].keywords
});

export default function VoiceAiCallingSystemPage() {
  return <ServiceSolutionPage slug="voice-ai-calling-system" />;
}
