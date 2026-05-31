"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/contacts", label: "Contacts" },
  { href: "/dashboard/companies", label: "Companies" },
  { href: "/dashboard/deals", label: "Deals" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/finance", label: "Finance" },
  { href: "/dashboard/contracts", label: "Contracts" },
  { href: "/dashboard/support", label: "Support" },
  { href: "/dashboard/ceo", label: "CEO" },
  { href: "/dashboard/conversations", label: "Conversations" },
  { href: "/dashboard/whatsapp", label: "WhatsApp" },
  { href: "/dashboard/company-brain", label: "Company Brain" },
  { href: "/dashboard/organizations", label: "Organizations" },
  { href: "/dashboard/users", label: "Users" },
  { href: "/dashboard/settings", label: "Settings" }
];

export function DashboardShell({
  user,
  children
}: {
  user: { name: string | null; email: string } | null;
  children: ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Revanta OS
              </p>
              <h1 className="mt-2 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Operations
              </h1>
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
            <div className="border-t border-slate-200 p-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Signed in</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{user?.name || user?.email || "Operator"}</p>
                <p className="text-xs text-slate-500">{user?.email || "No session"}</p>
                <button type="button" onClick={logout} className="button-secondary mt-4 w-full">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </aside>
        <main className="min-w-0">
          <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6 lg:px-8">
            <p className="text-sm text-slate-600">Internal execution workspace</p>
          </div>
          <div className="p-5 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
