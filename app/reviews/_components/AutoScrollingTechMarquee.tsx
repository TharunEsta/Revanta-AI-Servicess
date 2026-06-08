"use client";

import { motion } from "framer-motion";

const TECH = [
  "OpenAI",
  "Anthropic",
  "Google Cloud",
  "AWS",
  "Meta",
  "Vercel",
  "Cloudflare",
  "Supabase",
  "PostgreSQL",
  "Stripe",
  "Razorpay",
  "GitHub",
  "Docker",
  "Next.js",
  "React",
  "Node.js",
  "TypeScript"
];

function Chip({ name }: { name: string }) {
  return (
    <div
      className="group relative flex select-none items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-600 shadow-[0_10px_30px_rgba(17,17,17,0.04)] backdrop-blur transition hover:border-slate-300 hover:bg-white"
      aria-label={name}
    >
      <span className="relative text-slate-900/90 transition group-hover:text-slate-950">{name}</span>
      <span className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-200/0 via-indigo-200/40 to-emerald-200/0 opacity-0 blur-md transition group-hover:opacity-100" />
    </div>
  );
}

export function AutoScrollingTechMarquee() {
  const row = [...TECH, ...TECH];

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 p-3 shadow-soft">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />

      <motion.div
        className="flex w-max gap-3 px-2 py-2"
        animate={{ x: [0, -TECH.length * 140] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {row.map((t, idx) => (
          <div key={`${t}-${idx}`}> <Chip name={t} /> </div>
        ))}
      </motion.div>

      <div className="mt-4 text-center text-xs text-slate-500">
        Technologies actively used across our internal systems and client solutions.
      </div>
    </div>
  );
}

