"use client";

import * as React from "react";
import Link from "next/link";
import { PillBadge } from "@/components/ds/pill-badge";
import { PillButton } from "@/components/ds/pill-button";
import { ScrollReveal } from "@/components/ds/scroll-reveal";
import { Sparkles } from "lucide-react";

export function FinalCta(): React.JSX.Element {
  return (
    <section className="py-20 sm:py-28 px-4 max-w-6xl mx-auto w-full text-center select-none">
      <ScrollReveal direction="up">
        <div className="p-10 sm:p-16 rounded-3xl bg-zinc-950 text-white border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col items-center">
          {/* Ambient background glow */}
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

          <PillBadge
            tag="100% Free"
            subtext="No credit card required"
            className="bg-zinc-800 text-white border-zinc-700 mb-6"
          />

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-3xl leading-tight">
            Ready to watch together tonight?
          </h2>

          <p className="text-zinc-400 max-w-xl mx-auto mt-4 text-sm sm:text-base leading-relaxed">
            Create your free watch room now and start enjoying videos with
            friends in synchronized harmony.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/sign-up">
              <PillButton
                variant="outline"
                confettiOnClick={true}
                pulse={true}
                className="bg-white text-zinc-950 hover:bg-zinc-100 hover:text-black border-none text-base px-8 py-3.5 font-bold shadow-lg cursor-pointer"
                icon={<Sparkles className="w-4 h-4 text-amber-500" />}
              >
                Create Your Watch Room 🎉
              </PillButton>
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
