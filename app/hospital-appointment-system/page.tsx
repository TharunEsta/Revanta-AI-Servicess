import { ServiceSolutionPage } from "@/components/service-solution-page";
import { solutionPages } from "@/content/solution-pages";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: solutionPages["hospital-appointment-system"].metaTitle,
  description: solutionPages["hospital-appointment-system"].metaDescription,
  path: solutionPages["hospital-appointment-system"].path,
  keywords: solutionPages["hospital-appointment-system"].keywords
});

export default function HospitalAppointmentSystemPage() {
  return <ServiceSolutionPage slug="hospital-appointment-system" />;
}
