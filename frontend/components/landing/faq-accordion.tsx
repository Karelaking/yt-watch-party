"use client";

import * as React from "react";
import { PillBadge } from "@/components/ds/pill-badge";
import { ScrollReveal } from "@/components/ds/scroll-reveal";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/constants";

export function FaqAccordion(): React.JSX.Element {
  const [activeFaq, setActiveFaq] = React.useState<number | null>(null);

  return (
    <section
      id="faq"
      className="py-16 sm:py-20 px-4 max-w-4xl mx-auto w-full"
    >
      <ScrollReveal direction="up">
        <div className="text-center mb-10">
          <PillBadge tag="FAQ" subtext="Got questions?" className="mb-3" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>
      </ScrollReveal>

      <div className="space-y-3">
        {FAQ_ITEMS.map((faq, index) => {
          const isOpen = activeFaq === index;
          return (
            <ScrollReveal key={index} direction="up" delay={index * 0.05}>
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xs transition-all">
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between font-bold text-zinc-900 dark:text-white text-sm sm:text-base hover:bg-zinc-50/80 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 shrink-0 ml-2 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 pt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
