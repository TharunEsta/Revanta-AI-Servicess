import Image from "next/image";
import { Card } from "@/components/ui";

function Mock({ label }: { label: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(17,17,17,0.05)] transition hover:-translate-y-1 hover:shadow-[0_22px_64px_rgba(17,17,17,0.08)]">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-transparent to-emerald-50 opacity-0 transition group-hover:opacity-100" />
      <div className="relative p-5">
        <div className="flex items-center justify-between">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <div className="text-xs font-semibold text-slate-500">Placeholder</div>
        </div>
        <div className="mt-4 aspect-[16/9] rounded-[1.2rem] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4">
          <div className="h-full rounded-[0.9rem] border border-dashed border-slate-300 bg-white/60 flex items-center justify-center text-sm font-semibold text-slate-400">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CRMProductShowcase() {
  return (
    <Card className="bg-white p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Mock label="CRM Dashboard" />
        <Mock label="Leads Page" />
        <Mock label="Projects" />
        <Mock label="Analytics" />
      </div>
    </Card>
  );
}

