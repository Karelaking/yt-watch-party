"use client";

import * as React from "react";
import { BentoCard } from "@/components/ds/bento-card";
import { ScrollReveal } from "@/components/ds/scroll-reveal";
import { Zap, MessageSquare, Lock, Globe2 } from "lucide-react";

export function FeaturesGrid(): React.JSX.Element {
  return (
    <section
      id="features"
      className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full"
    >
      <ScrollReveal direction="up">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900">
            Everything You Need For The Perfect Party
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto mt-3 text-sm sm:text-base">
            Built from scratch with modern WebSockets, high-frequency timecode
            sync, and delightful micro-interactions.
          </p>
        </div>
      </ScrollReveal>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 - Frame Perfect Sync */}
        <ScrollReveal direction="up" delay={0.05} className="md:col-span-2">
          <BentoCard
            icon={Zap}
            iconBg="bg-amber-100 text-amber-900 border-amber-200"
            tag="Sub-15ms"
            title="Frame-Perfect Clock Synchronization"
            description="Our continuous drift-correction algorithm calibrates millisecond network latency across all connected peers, ensuring everyone reacts to the punchline at the exact same instant."
            preview={
              <div className="w-full py-4 px-6 flex items-center justify-between bg-white rounded-xl border border-zinc-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <div className="text-xs font-bold text-zinc-900">
                      Timecode Delta
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Host vs Client: 0.008s
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  LOCKED SYNC
                </span>
              </div>
            }
          />
        </ScrollReveal>

        {/* Card 2 - Interactive Chat & Live Reactions */}
        <ScrollReveal direction="up" delay={0.1} className="md:col-span-1">
          <BentoCard
            icon={MessageSquare}
            iconBg="bg-blue-100 text-blue-900 border-blue-200"
            tag="Real-Time"
            title="Animated Reactions & Chat"
            description="Drop flying popcorn, laughing emojis, and synchronized sound effects right over the video stream."
            preview={
              <div className="flex items-center justify-center gap-2 py-2">
                <span className="text-2xl animate-bounce">🍿</span>
                <span className="text-2xl animate-bounce delay-100">🔥</span>
                <span className="text-2xl animate-bounce delay-200">😂</span>
                <span className="text-2xl animate-bounce delay-300">🎉</span>
              </div>
            }
          />
        </ScrollReveal>

        {/* Card 3 - Smart Host Controls */}
        <ScrollReveal direction="up" delay={0.15} className="md:col-span-1">
          <BentoCard
            icon={Lock}
            iconBg="bg-purple-100 text-purple-900 border-purple-200"
            tag="Role Management"
            title="Granular Host Permissions"
            description="Lock playback controls to the room host, pass the DJ crown, or vote on queue additions democratically."
            preview={
              <div className="w-full space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-zinc-200">
                  <span className="font-medium text-zinc-700">DJ Pass Mode</span>
                  <span className="font-bold text-zinc-900 text-[11px] bg-zinc-100 px-2 py-0.5 rounded-md">
                    Host Only
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-zinc-200">
                  <span className="font-medium text-zinc-700">Queue Voting</span>
                  <span className="font-bold text-emerald-600 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md">
                    Enabled
                  </span>
                </div>
              </div>
            }
          />
        </ScrollReveal>

        {/* Card 4 - Zero Setup & No Extensions */}
        <ScrollReveal direction="up" delay={0.2} className="md:col-span-2">
          <BentoCard
            icon={Globe2}
            iconBg="bg-emerald-100 text-emerald-900 border-emerald-200"
            tag="Cross Platform"
            title="Zero Installation Required"
            description="No buggy Chrome extensions to install or permissions to grant. Works smoothly on iPhone, Android, Mac, Windows, Linux, and even Smart TV browsers with just a shareable URL."
            preview={
              <div className="w-full grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs font-semibold text-zinc-800">
                  📱 Mobile
                </div>
                <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs font-semibold text-zinc-800">
                  💻 Desktop
                </div>
                <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs font-semibold text-zinc-800">
                  📺 Smart TV
                </div>
              </div>
            }
          />
        </ScrollReveal>
      </div>
    </section>
  );
}
