'use client';

import { useEffect, useState } from 'react';
import { ApplicationForm } from "@/components/internship/ApplicationForm";

export default function ApplyPage() {
  const [applicationCount, setApplicationCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/applications/count');
        if (res.ok) {
          const data = await res.json();
          setApplicationCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch application count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  const isAccepting = applicationCount === null || applicationCount <= 4;

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
            {!isAccepting && (
              <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-6">
                <h2 className="font-[var(--font-display)] text-xl font-semibold text-amber-950">
                  Applications Closed
                </h2>
                <p className="mt-2 text-amber-800">
                  We are no longer accepting applications for this internship at this time. Thank you for your interest!
                </p>
              </div>
            )}

            {loading ? (
              <p className="text-center text-slate-600">Loading...</p>
            ) : (
              <ApplicationForm isAccepting={isAccepting} />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
