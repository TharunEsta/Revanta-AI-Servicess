"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });
    const data = await response.json();

    setLoading(false);
    if (!response.ok) {
      setError(data?.error || "Login failed");
      return;
    }

    router.push(nextUrl);
    router.refresh();
  }

  return (
    <main className="shell flex min-h-[calc(100vh-9rem)] items-center justify-center py-16">
      <form onSubmit={onSubmit} className="panel w-full max-w-md space-y-5 bg-white p-8">
        <div>
          <p className="eyebrow">Revanta OS</p>
          <h1 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950">
            Sign in
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Use your operational account to access the dashboard.
          </p>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Email or username</span>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 focus:border-slate-400"
            autoComplete="username"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 focus:border-slate-400"
            autoComplete="current-password"
          />
        </label>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className="button-primary w-full disabled:opacity-60">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="shell flex min-h-[calc(100vh-9rem)] items-center justify-center py-16" />}>
      <LoginForm />
    </Suspense>
  );
}
