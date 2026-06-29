import { redirect } from "next/navigation";

export { metadata } from "@/components/revanta-os-page";

export default function RevantaOsPageRedirect() {
  redirect("/services");
}
