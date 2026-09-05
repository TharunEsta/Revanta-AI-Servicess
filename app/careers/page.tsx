import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Card, CtaBanner, PageHero, SectionIntro } from "@/components/ui";

export const metadata = buildMetadata({
  title: "Careers",
  description: "Join RevantaAI as a Software Development Intern. Gain hands-on experience with modern web development technologies.",
  path: "/careers"
});

export default function CareersPage() {
  return (
    <main>
      <PageHero
        eyebrow="Careers at RevantaAI"
        title="Build real-world technology, work with modern development tools, and gain practical experience."
        description="Join RevantaAI and work on real software products. Support our mission to help businesses automate operations and grow with practical technology solutions."
        primaryCta={{ label: "View Opportunities", href: "#openings" }}
      />

      <section className="section py-12">
        <div className="shell">
          <SectionIntro
            eyebrow="Why Join Us"
            title="What We Offer"
            description="More than just an internship—real project experience with a real impact."
            align="center"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card>
              <h3 className="font-[var(--font-display)] text-lg font-semibold">Real Projects</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Work on actual software products used by real clients. Your code will ship to production.
              </p>
            </Card>
            <Card>
              <h3 className="font-[var(--font-display)] text-lg font-semibold">Learn Modern Stack</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Hands-on experience with Next.js, React, Node.js, PostgreSQL, and modern development practices.
              </p>
            </Card>
            <Card>
              <h3 className="font-[var(--font-display)] text-lg font-semibold">Mentorship</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Work with experienced developers. Get feedback, guidance, and help growing your technical skills.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="section py-12" id="openings">
        <div className="shell">
          <SectionIntro
            eyebrow="Job Openings"
            title="Available Opportunities"
            description="Currently accepting applications for internship positions."
            align="center"
          />
          <div className="mt-12 space-y-6">
            <div className="panel p-7 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <h3 className="font-[var(--font-display)] text-xl font-semibold">Software Development Intern</h3>
                  <p className="mt-2 text-sm text-slate-600">Full-time · Internship</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Work on real-world software development tasks. Gain hands-on experience with frontend, backend, and full-stack development. Build features, fix bugs, and learn modern development practices.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      B.Tech
                    </span>
                    <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      2027 / 2028
                    </span>
                    <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      AI & DS
                    </span>
                    <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      AI & ML
                    </span>
                    <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      AI & CSE
                    </span>
                  </div>
                  <span className="mt-4 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Open
                  </span>
                </div>
                <Link
                  href="/careers/software-development-intern"
                  className="button-primary mt-4 sm:mt-0"
                >
                  View Position
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner />
    </main>
  );
}
