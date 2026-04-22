"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { navigation } from "@/content/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="shell">
        <div className="flex min-h-20 items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Revanta AI home">
            <Image
              src="/logo-horizontal.svg"
              alt="Revanta AI"
              width={180}
              height={48}
              className="h-11 w-auto"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-slate-600 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:block">
            <Link href="/contact" className="button-primary">
              Book Consultation
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 lg:hidden"
            aria-expanded={open}
            aria-label="Toggle navigation"
            onClick={() => setOpen((current) => !current)}
          >
            <span className="space-y-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-slate-900" />
              <span className="block h-0.5 w-5 rounded-full bg-slate-900" />
              <span className="block h-0.5 w-5 rounded-full bg-slate-900" />
            </span>
          </button>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300 lg:hidden",
            open ? "max-h-96 pb-5" : "max-h-0"
          )}
        >
          <div className="panel flex flex-col gap-2 bg-white p-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/contact" className="button-primary mt-2" onClick={() => setOpen(false)}>
              Start Project
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
