import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Card, SectionIntro } from "@/components/ui";

export const metadata = buildMetadata({
  title: "Software Development Intern",
  description: "Join RevantaAI as a Software Development Intern. Build real-world projects with modern technologies.",
  path: "/careers/software-development-intern"
});

const TECH_STACK = [
  "Next.js",
  "React",
  "JavaScript / TypeScript",
  "Tailwind CSS",
  "Node.js",
  "Express.js",
  "PostgreSQL",
  "REST APIs",
  "Git",
  "GitHub"
];

const BENEFITS = [
  {
    title: "Internship Certificate",
    description: "Receive an official Internship Certificate upon successful completion."
  },
  {
    title: "Real-World Project Experience",
    description: "Work on actual software development tasks and real products."
  },
  {
    title: "Technology Stack Exposure",
    description: "Learn modern web development tools and best practices."
  },
  {
    title: "Technical Guidance",
    description: "Get mentorship and feedback from experienced developers."
  },
  {
    title: "Resume Building",
    description: "Add real project experience to your portfolio and resume."
  },
  {
    title: "Practical Development Skills",
    description: "Hands-on experience with frontend, backend, database, and deployment."
  }
];

export default function InternshipPage() {
  return (
    <main>
      <section className="section py-12 sm:py-16 lg:py-18">
        <div className="shell">
          <div className="mx-auto max-w-4xl">
            <Link href="/careers" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              ← Back to Careers
            </Link>
            <h1 className="mt-6 font-[var(--font-display)] text-4xl font-semibold tracking-[-0.07em] text-slate-950 sm:text-5xl">
              Software Development Intern
            </h1>
            <p className="mt-4 text-lg text-slate-600">Full-time Internship · Open</p>
          </div>
        </div>
      </section>

      <section className="section py-12">
        <div className="shell">
          <div className="mx-auto max-w-4xl space-y-12">
            <div>
              <SectionIntro
                eyebrow="About This Role"
                title="What You'll Do"
                description=""
                align="left"
              />
              <div className="mt-6 space-y-4 text-slate-700">
                <p className="leading-8">
                  As a Software Development Intern at RevantaAI, you'll work on real-world software development tasks alongside our team. You'll be assigned work based on your technical level and interests, ranging from frontend features to backend APIs to database operations.
                </p>
                <p className="leading-8">
                  You'll gain practical experience in:
                </p>
                <ul className="space-y-2 pl-6">
                  <li className="list-disc">Frontend development with React and Next.js</li>
                  <li className="list-disc">Backend development with Node.js and Express</li>
                  <li className="list-disc">Database design and operations with PostgreSQL</li>
                  <li className="list-disc">API development and integration</li>
                  <li className="list-disc">Authentication and security</li>
                  <li className="list-disc">Testing and debugging</li>
                  <li className="list-disc">Git workflows and GitHub collaboration</li>
                  <li className="list-disc">Code review and quality practices</li>
                </ul>
              </div>
            </div>

            <div>
              <SectionIntro
                eyebrow="Eligibility"
                title="Who Can Apply"
                description=""
                align="left"
              />
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900">Degree</h4>
                    <p className="mt-2 text-slate-700">B.Tech</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Specialization</h4>
                    <p className="mt-2 text-slate-700">AI & DS • AI & ML • AI & CSE</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Expected Graduation</h4>
                    <p className="mt-2 text-slate-700">2027 or 2028</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionIntro
                eyebrow="What You'll Get"
                title="Benefits & Learning"
                description=""
                align="left"
              />
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {BENEFITS.map((benefit) => (
                  <Card key={benefit.title}>
                    <h4 className="font-semibold text-slate-900">{benefit.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{benefit.description}</p>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <SectionIntro
                eyebrow="Technology Stack"
                title="You'll Learn"
                description=""
                align="left"
              />
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {TECH_STACK.map((tech) => (
                  <div key={tech} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
                    <div className="h-2 w-2 rounded-full bg-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{tech}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Ready to apply?</h3>
                <p className="mt-1 text-sm text-slate-600">Complete the application form and we'll review it shortly.</p>
              </div>
              <Link href="/careers/software-development-intern/apply" className="button-primary w-full sm:w-auto">
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
