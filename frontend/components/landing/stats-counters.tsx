"use client";

import * as React from "react";
import { AnimatedCounter } from "@/components/ds/animated-counter";
import { STATS_METRICS } from "@/lib/constants";

export function StatsCounters(): React.JSX.Element {
  return (
    <section className="py-16 sm:py-20 bg-zinc-950 text-white select-none">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS_METRICS.map((stat, idx) => (
          <AnimatedCounter
            key={idx}
            value={stat.value}
            decimals={stat.decimals}
            suffix={stat.suffix}
            label={stat.label}
            sublabel={stat.sublabel}
            className="text-white **:text-white"
          />
        ))}
      </div>
    </section>
  );
}
