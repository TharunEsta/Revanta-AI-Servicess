'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 sm:py-16">
      <section className="section">
        <div className="shell">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-[-0.07em] text-slate-950 sm:text-5xl">
              Application Submitted Successfully
            </h1>

            <p className="mt-6 text-lg text-slate-600">
              Thank you for applying for the Software Development Intern position at RevantaAI.
            </p>

            <div className="mt-8 rounded-lg border border-slate-200 bg-white p-8">
              <h2 className="font-[var(--font-display)] text-2xl font-semibold text-slate-900">What's Next?</h2>

              <div className="mt-6 space-y-4 text-left">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-900">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Application Under Review</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Your application has been received and will be reviewed by our team.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-900">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Confirmation Email</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      We'll send you a confirmation email shortly. Check your inbox (and spam folder).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-900">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Shortlist Notification</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Shortlisted candidates will be contacted regarding the next stage of the selection process.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {applicationId && (
              <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-600">
                  Application ID: <span className="font-mono font-semibold text-slate-900">{applicationId}</span>
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/careers" className="button-secondary">
                Back to Careers
              </Link>
              <Link href="/" className="button-primary">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
