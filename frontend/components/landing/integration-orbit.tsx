"use client";

import * as React from "react";
import { ScrollReveal } from "@/components/ds/scroll-reveal";
import { LogoOrbit } from "@/components/ds/logo-orbit";

export function IntegrationOrbit(): React.JSX.Element {
  return (
    <section
      id="sync-tech"
      className="py-12 sm:py-20 border-t border-zinc-100 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 h-screen flex justify-center items-center relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 text-center">
        <ScrollReveal direction="up">
          <h2 className="text-3xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Connected to Your Favorite Platforms
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-3xl mx-auto mt-2 text-sm sm:text-xl">
            Sync playback across YouTube streams, Discord servers, Chrome tabs,
            and spatial audio hubs.
          </p>
        </ScrollReveal>

        {/* Brandly-style curved radiating node network */}
        <div className="mt-38!">
          <LogoOrbit />
        </div>
      </div>
    </section>
  );
}
