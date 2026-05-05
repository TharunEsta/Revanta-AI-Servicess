import { ServiceSolutionPage } from "@/components/service-solution-page";
import { solutionPages } from "@/content/solution-pages";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: solutionPages["whatsapp-booking-system"].metaTitle,
  description: solutionPages["whatsapp-booking-system"].metaDescription,
  path: solutionPages["whatsapp-booking-system"].path,
  keywords: solutionPages["whatsapp-booking-system"].keywords
});

export default function WhatsAppBookingSystemPage() {
  return <ServiceSolutionPage slug="whatsapp-booking-system" />;
}
