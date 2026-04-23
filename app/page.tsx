import Image from "next/image";
import Link from "next/link";
import {
  differentiators,
  founderSection,
  founderPoints,
  homepageMetrics,
  serviceHighlights,
  trustStrip
} from "@/content/site";
import { ReviewCard } from "@/components/review-card";
import { buildMetadata } from "@/lib/seo";
import { getApprovedReviews } from "@/lib/reviews";
import { Card, CtaBanner, PageHero, SectionIntro } from "@/components/ui";

export const metadata = buildMetadata({
  title: "AI Systems and Premium Software That Grow Businesses",
  description:
    "Revanta AI helps ambitious companies launch products, automate operations, and scale with modern technology.",
  path: "/"
});

export default async function HomePage() {
  const approvedReviews = await getApprovedReviews();
  const featuredReviews = [...approvedReviews]
    .sort(
      (left, right) =>
        new Date(right.approvedAt ?? right.submittedAt).getTime() -
        new Date(left.approvedAt ?? left.submittedAt).getTime()
    )
    .slice(0, 3);
  const reviewSummary = {
    totalCount: approvedReviews.length,
    averageRating: approvedReviews.length
      ? Number(
          (
            approvedReviews.reduce((sum, review) => sum + review.rating, 0) /
            approvedReviews.length
          ).toFixed(1)
        )
      : 0
  };

  const resultAreas = [
    "Launch velocity",
    "Delivery clarity",
    "System quality",
    "Executive access"
  ];

  return (
    <main>
      <PageHero
        eyebrow="Founder-led AI product studio"
        title="AI systems and premium software for companies ready to scale."
        description="Revanta AI designs high-trust websites, AI automations, and custom software systems that help ambitious businesses look sharper, move faster, and operate with more control."
        primaryCta={{ label: "Book Consultation", href: "/contact" }}
        secondaryCta={{ label: "Explore Services", href: "/services" }}
      />

      <section className="-mt-8 pb-10 sm:-mt-10">
        <div className="shell">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="panel grid gap-4 bg-slate-50 p-5 sm:grid-cols-3 sm:p-6">
              {[
                "Premium positioning for serious buyers",
                "Founder-led communication from day one",
                "Built for launch speed and long-term scale"
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="panel flex flex-col justify-between gap-5 bg-white p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                  Best fit
                </p>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  For founders, operators, and teams that need a premium digital presence without
                  slow agency layers.
                </p>
              </div>
              <Link href="/contact" className="button-secondary w-fit">
                Start Project
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="shell">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {trustStrip.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50 px-5 py-5 shadow-soft"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionIntro
            eyebrow="Services"
            title="A premium software stack for growth, operations, and product execution."
            description="Each offer is positioned to feel credible to premium buyers with clear outcomes, modern UX, and a stronger technical foundation from the first conversation."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {serviceHighlights.slice(0, 6).map((service) => (
              <Card key={service.slug} className="flex h-full flex-col justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                    {service.eyebrow}
                  </p>
                  <h3 className="mt-4 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {service.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{service.description}</p>
                </div>
                <Link href={service.href} className="mt-8 button-secondary w-fit">
                  View Service Page
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="relative overflow-hidden bg-white">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-slate-100 blur-3xl" />
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4 shadow-soft">
                <div className="relative overflow-hidden rounded-[1.5rem] bg-[#111111]">
                  <Image
                    src="/tharun-esta-founder.jpeg"
                    alt="Tharun Esta, Founder of Revanta AI"
                    width={720}
                    height={900}
                    className="relative h-full w-full object-contain"
                    priority
                  />
                </div>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Founder trust</p>
                <h2 className="mt-4 max-w-xl font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                  {founderSection.title}
                </h2>
                <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
                  {founderSection.message}
                </p>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">
                  {founderSection.supporting}
                </p>
                <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                    Founder-led delivery
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">
                    {founderSection.signature}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{founderSection.role}</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {founderPoints.map((point) => (
              <Card key={point.title}>
                <h3 className="font-[var(--font-display)] text-lg font-semibold tracking-[-0.03em]">
                  {point.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{point.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionIntro
            eyebrow="Why choose Revanta AI"
            title="Designed to create authority before the sales call starts."
            description="The positioning, design system, and build quality work together to raise perceived value, improve trust, and support higher-quality conversations."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {differentiators.map((item) => (
              <Card key={item.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {item.eyebrow}
                </p>
                <h3 className="mt-4 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em]">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-8">
        <div className="shell">
          <SectionIntro
            eyebrow="Results metrics"
            title="Signals that make the offer feel more serious."
            description="These operating benchmarks communicate speed, quality, and access in a way that supports premium buying decisions."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {homepageMetrics.map((metric, index) => (
              <Card key={metric.value} className="min-h-[220px]">
                <p className="text-4xl font-semibold tracking-[-0.08em] text-slate-950">
                  {metric.value}
                </p>
                <p className="mt-4 text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                  {resultAreas[index]}
                </p>
                <p className="mt-5 text-sm leading-7 text-slate-600">{metric.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionIntro
            eyebrow="Testimonials"
            title="Trusted by Businesses That Value Quality Execution"
            description="Revanta AI helps founders and companies build premium software, automation systems, and scalable products."
          />

          {featuredReviews.length > 0 ? (
            <>
              <div className="mt-10">
                <Card className="max-w-2xl bg-slate-50">
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Overall rating</p>
                  <div className="mt-4 flex items-end gap-3">
                    <span className="font-[var(--font-display)] text-5xl font-semibold text-slate-950">
                      {reviewSummary.averageRating.toFixed(1)}
                    </span>
                    <span className="pb-1 text-sm text-slate-500">out of 5</span>
                  </div>
                  <div className="mt-4 flex gap-1 text-xl text-amber-400">
                    {Array.from({ length: 5 }, (_, index) => (
                      <span key={index}>{index < Math.round(reviewSummary.averageRating) ? "★" : "☆"}</span>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-slate-600">
                    {reviewSummary.totalCount} verified review{reviewSummary.totalCount === 1 ? "" : "s"}
                  </p>
                  <Link href="/reviews" className="mt-8 button-primary w-fit">
                    View All Reviews
                  </Link>
                </Card>
              </div>

              <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {featuredReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </>
          ) : (
            <Card className="mt-10 bg-slate-50">
              <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                <div>
                  <h3 className="font-[var(--font-display)] text-3xl font-semibold text-slate-950">
                    Premium delivery built on trust, clarity, and consistency
                  </h3>
                  <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                    Revanta AI works closely with founders and companies that want stronger digital
                    execution, cleaner systems, and product-quality delivery that supports long-term growth.
                  </p>
                  <Link href="/contact" className="mt-8 button-primary w-fit">
                    Book Consultation
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    "Founder-led delivery",
                    "Clear communication",
                    "Reliable execution",
                    "Long-term support"
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-sm font-medium text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </section>

      <CtaBanner />
    </main>
  );
}
