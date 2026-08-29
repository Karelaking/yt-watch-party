"use client";

import * as React from "react";
import { PillBadge } from "@/components/ds/pill-badge";
import { ScrollReveal } from "@/components/ds/scroll-reveal";
import { TESTIMONIALS } from "@/lib/constants";

export function Testimonials(): React.JSX.Element {
  return (
    <section
      id="reviews"
      className="py-16 sm:py-24 px-4 max-w-6xl mx-auto w-full"
    >
      <ScrollReveal direction="up">
        <div className="text-center mb-12">
          <PillBadge
            tag="Reviews"
            subtext="What creators are saying"
            className="mb-3"
          />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Loved by Friends & Communities Worldwide
          </h2>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((item, index) => (
          <ScrollReveal key={item.id} direction="up" delay={0.05 * (index + 1)}>
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs flex flex-col justify-between h-full">
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic mb-6">
                “{item.quote}”
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div
                  className={`h-10 w-10 rounded-full ${item.avatarBg} text-white font-bold flex items-center justify-center text-xs`}
                >
                  {item.initials}
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-zinc-400 dark:text-zinc-500">{item.role}</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
