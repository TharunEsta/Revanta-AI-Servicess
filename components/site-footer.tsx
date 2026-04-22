import Image from "next/image";
import Link from "next/link";
import { navigation, siteConfig } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-12">
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.8fr_0.9fr]">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo.svg" alt="Revanta AI" width={52} height={52} className="h-12 w-12" />
              <span className="text-lg font-semibold tracking-tight text-slate-950">Revanta AI</span>
            </Link>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Revanta AI helps businesses build AI automation systems, SaaS platforms, mobile
              apps, websites, internal tools, CRM systems, and custom software with a premium,
              scalable execution standard.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Pages
            </h3>
            <div className="mt-4 grid gap-3 text-sm">
              {navigation.map((item) => (
                <Link key={item.href} href={item.href} className="text-slate-600 hover:text-slate-950">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Contact
            </h3>
            <a href={`tel:${siteConfig.phone}`} className="block text-sm text-slate-600 hover:text-slate-950">
              {siteConfig.phone}
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="block text-sm text-slate-600 hover:text-slate-950"
            >
              {siteConfig.email}
            </a>
            <a
              href={`mailto:${siteConfig.alternateSalesEmail}`}
              className="block text-sm text-slate-600 hover:text-slate-950"
            >
              {siteConfig.alternateSalesEmail}
            </a>
            <p className="text-sm text-slate-500">{siteConfig.location}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
