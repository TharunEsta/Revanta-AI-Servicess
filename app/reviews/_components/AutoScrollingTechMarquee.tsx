"use client";

import { motion } from "framer-motion";

import {
  siGooglecloud,
  siAmazonwebservices,
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
  siOpenai,
  siAnthropic,
  siPython,
  siJava,
  siSpring,
  siCsharp,
  siDotnet,
  siFlutter,
  siMongodb,
  siMysql,
  siRedis
} from "simple-icons";

const TECH_ICONS = [
  siGooglecloud,
  siAmazonwebservices,
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
  siOpenai,
  siAnthropic,
  siPython,
  siJava,
  siSpring,
  siCsharp,
  siDotnet,
  siFlutter,
  siMongodb,
  siMysql,
  siRedis
].filter(Boolean);

function SimpleIconSvg({ icon }: { icon: { path: string; hex: string } }) {
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
  const TRACK_DISTANCE = 1600;


  console.log("TECH_ICONS", TECH_ICONS.length);
  console.log("TRACK_DISTANCE", TRACK_DISTANCE);

  console.log("DURATION", 8);


  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 p-3 shadow-soft">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />

      <motion.div
        className="flex items-center gap-12 whitespace-nowrap"
        animate={{ x: -1600 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
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

