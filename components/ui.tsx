import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta
}: {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}) {
  return (
    <section className="section pb-12 pt-12 sm:pt-16 lg:pt-18">
      <div className="shell">
        <div className="panel relative overflow-hidden bg-white p-7 sm:p-10 lg:p-14">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-[44%] bg-gradient-to-l from-slate-50 to-transparent" />
          <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-slate-100 blur-3xl" />
          <div className="absolute left-0 top-20 h-64 w-64 rounded-full bg-slate-100 blur-3xl" />
          <div className="relative max-w-4xl space-y-6">
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="max-w-4xl font-[var(--font-display)] text-4xl font-semibold tracking-[-0.07em] text-slate-950 sm:text-5xl lg:text-[4.75rem] lg:leading-[0.98]">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg sm:leading-9">
              {description}
            </p>
            {(primaryCta || secondaryCta) && (
              <div className="flex flex-wrap gap-3 pt-2 sm:gap-4">
                {primaryCta ? (
                  <Link href={primaryCta.href} className="button-primary">
                    {primaryCta.label}
                  </Link>
                ) : null}
                {secondaryCta ? (
                  <Link href={secondaryCta.href} className="button-secondary">
                    {secondaryCta.label}
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  description,
  align = "left"
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("section-heading", align === "center" && "mx-auto text-center")}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-slate-950 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="max-w-2xl text-base leading-8 text-slate-600">{description}</p>
    </div>
  );
}

export function Card({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("panel p-6 sm:p-7", className)}>{children}</div>;
}

export function CtaBanner() {
  return (
    <section className="section pt-8">
      <div className="shell">
        <div className="panel relative overflow-hidden bg-slate-50 p-8 sm:p-10 lg:p-12">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-white to-transparent" />
          <div className="absolute -right-10 top-0 h-56 w-56 rounded-full bg-white blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <span className="eyebrow">Next step</span>
              <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
                Ready to get more leads and save time?
              </h2>
              <p className="text-base leading-8 text-slate-600">
                Revanta AI builds websites, automations, dashboards, and software that help teams
                respond faster, reduce manual work, and run with more control.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="button-primary">
                Book Consultation
              </Link>
              <Link href="/contact" className="button-secondary">
                Talk to Founder
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
