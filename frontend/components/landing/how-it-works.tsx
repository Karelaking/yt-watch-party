"use client";

import * as React from "react";
import { PillBadge } from "@/components/ds/pill-badge";
import { StepCard } from "@/components/ds/step-card";
import { ScrollReveal } from "@/components/ds/scroll-reveal";
import { Film, Share2, Play } from "lucide-react";

export function HowItWorks(): React.JSX.Element {
  return (
    <section
      id="how-it-works"
      className="py-16 sm:py-24 bg-zinc-100/70 border-y border-zinc-200/80"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal direction="up">
          <div className="text-center mb-14">
            <PillBadge
              tag="Workflow"
              subtext="Three simple steps"
              className="mb-3"
            />
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900">
              How WatchParty Works
            </h2>
            <p className="text-zinc-500 max-w-lg mx-auto mt-3 text-sm sm:text-base">
              From a YouTube link to a full watch party in under 10 seconds.
            </p>
          </div>
        </ScrollReveal>

        {/* Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScrollReveal direction="up" delay={0.05}>
            <StepCard
              stepNumber="01"
              title="Paste Any YouTube Link"
              description="Drop in any YouTube video, livestream, playlist, or premiere URL to create your private room."
              icon={<Film className="w-6 h-6" />}
            />
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.12}>
            <StepCard
              stepNumber="02"
              title="Share One Magic Invite Link"
              description="Send the custom room link to your friends via Discord, WhatsApp, or group chat. No sign-up required."
              icon={<Share2 className="w-6 h-6" />}
              active={true}
            />
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.19}>
            <StepCard
              stepNumber="03"
              title="Enjoy Synced Playback"
              description="Hit play. When one person pauses, buffers, or seeks, everyone's video stays locked in perfect harmony."
              icon={<Play className="w-6 h-6" />}
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
