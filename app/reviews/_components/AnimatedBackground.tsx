"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-200/70 via-sky-200/60 to-cyan-200/60 blur-3xl"
        animate={{ x: [0, 24, 0], y: [0, 16, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 top-64 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-200/40 via-teal-200/40 to-emerald-100/40 blur-3xl"
        animate={{ x: [0, -26, 0], y: [0, 18, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_45%)]" />
    </div>
  );
}

