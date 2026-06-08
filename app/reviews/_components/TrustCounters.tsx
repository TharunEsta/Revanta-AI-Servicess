"use client";

import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { trustCenterCountersConfig } from "../trust-center-config";


function formatInt(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function TrustCounters() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Counter title="CRM Systems Built" value={trustCenterCountersConfig.crmSystemsBuilt} />
      <Counter title="Automations Developed" value={trustCenterCountersConfig.automationsDeveloped} />
      <Counter title="Hours Invested" value={trustCenterCountersConfig.hoursInvested} />
      <Counter title="Technologies Integrated" value={trustCenterCountersConfig.technologiesIntegrated} />
    </div>
  );
}

function Counter({ title, value }: { title: string; value: number }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 900 });
  const display = useTransform(spring, (latest) => formatInt(Math.round(latest)));

  React.useEffect(() => {
    motionVal.set(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);


  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      className="relative rounded-[1.8rem] border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur"
    >
      <div className="absolute inset-0 rounded-[1.8rem] bg-gradient-to-br from-indigo-50/80 via-transparent to-emerald-50/80 opacity-0 transition hover:opacity-100" />
      <div className="relative">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</div>
        <motion.div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          {display}
        </motion.div>
        <div className="mt-3 text-sm leading-7 text-slate-600">
          Editable placeholders for credibility.
        </div>
      </div>
    </motion.div>
  );
}

