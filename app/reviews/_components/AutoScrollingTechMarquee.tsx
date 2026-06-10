"use client";

import React from "react";
import { motion } from "framer-motion";

import {
  siGooglecloud,
  siVercel,
  siCloudflare,
  siSupabase,
  siPostgresql,
  siStripe,
  siRazorpay,
  siGithub,
  siDocker,
  siNextdotjs,
  siReact,
  siTypescript,
  siNodedotjs,
  siAnthropic,
  siPython,
  siSpring,
  siDotnet,
  siFlutter,
  siMongodb,
  siMysql,
  siRedis
} from "simple-icons";

const TECH_ICONS = [
  siGooglecloud,
  siVercel,
  siCloudflare,
  siSupabase,
  siPostgresql,
  siStripe,
  siRazorpay,
  siGithub,
  siDocker,
  siNextdotjs,
  siReact,
  siTypescript,
  siNodedotjs,
  siAnthropic,
  siPython,
  siSpring,
  siDotnet,
  siFlutter,
  siMongodb,
  siMysql,
  siRedis
].filter(Boolean);

function SimpleIconSvg({
  icon
}: {
  icon: { path: string; hex: string };
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={56}
      height={56}
      fill={`#${icon.hex}`}
      aria-hidden="true"
    >
      <path d={icon.path} />
    </svg>
  );
}

export function AutoScrollingTechMarquee() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 p-3 shadow-soft">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />

      <motion.div
        className="flex items-center gap-12 whitespace-nowrap"
        animate={{ x: "-50%" }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      >
        {[...TECH_ICONS, ...TECH_ICONS].map((icon, idx) => (
          <div
            key={idx}
            className="flex h-[56px] w-[56px] items-center justify-center"
            aria-hidden="true"
          >
            <SimpleIconSvg icon={icon} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

