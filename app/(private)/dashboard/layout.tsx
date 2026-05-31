import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSessionUser } from "@/lib/revanta-os/auth";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  return <DashboardShell user={{ name: session.name, email: session.email }}>{children}</DashboardShell>;
}

