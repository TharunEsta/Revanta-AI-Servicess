import { buildMetadata } from "@/lib/seo";
import { ApplicationForm } from "@/components/internship/ApplicationForm";

export const metadata = buildMetadata({
  title: "Apply for Software Development Intern",
  description: "Apply for the Software Development Internship at RevantaAI.",
  path: "/careers/software-development-intern/apply"
});

export default function ApplyPage() {
  return (
    <main>
      <section className="section py-12 sm:py-16">
        <div className="shell">
          <div className="mx-auto max-w-2xl">
            <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-[-0.07em] text-slate-950 sm:text-5xl">
              Application Form
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Software Development Intern at RevantaAI
            </p>
          </div>
        </div>
      </section>

      <section className="section py-12">
        <div className="shell">
          <div className="mx-auto max-w-2xl">
            <ApplicationForm />
          </div>
        </div>
      </section>
    </main>
  );
}
