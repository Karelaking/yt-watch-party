"use client";

import * as React from "react";
import { YouTubeIcon } from "@/components/ds/brand-icons";
import {
  Users,
  Play,
  Pause,
  MessageSquare,
  Star,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function AuthShowcase(): React.JSX.Element {
  const showcaseRef = React.useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(true);

  useGSAP(
    () => {
      if (!showcaseRef.current) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        ".showcase-brand",
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.6 }
      )
        .fromTo(
          ".showcase-headline",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.3"
        )
        .fromTo(
          ".showcase-player-card",
          { opacity: 0, y: 30, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power2.out" },
          "-=0.4"
        )
        .fromTo(
          ".showcase-metric",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
          "-=0.3"
        );
    },
    { scope: showcaseRef }
  );

  return (
    <div
      ref={showcaseRef}
      className="w-full h-full flex flex-col justify-between p-8 sm:p-12 lg:p-14 relative overflow-hidden bg-zinc-950 text-white select-none"
    >
      {/* Ambient background glow & grid */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 space-y-6">
        <div className="showcase-brand flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-white text-zinc-950 flex items-center justify-center font-bold text-sm shadow-md shadow-white/10">
              <Play className="h-4 w-4 fill-zinc-950 text-zinc-950 ml-0.5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block leading-none">
                WatchParty
              </span>
              <span className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase">
                Synchronized Streaming
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-1 rounded-full text-xs font-semibold text-zinc-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live Stream Sync</span>
          </div>
        </div>

        <div className="showcase-headline space-y-3 max-w-lg">
          <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-white leading-tight">
            Stream YouTube together,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-200 to-white">
              zero latency.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Create instant watch rooms, sync video playback with frame-perfect precision,
            and chat with friends in real-time.
          </p>
        </div>
      </div>

      {/* Center Interactive Cinema Player Mockup */}
      <div className="showcase-player-card relative my-8 z-10">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-4 shadow-2xl shadow-black/60 transition-transform duration-300 hover:border-zinc-700">
          {/* Player Top Navigation */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="h-7 px-2.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center gap-1.5 text-xs font-bold">
                <YouTubeIcon className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                <span>#party-cinema-391</span>
              </div>
              <span className="text-[11px] font-semibold text-zinc-400 hidden sm:inline">
                Lofi Midnight Beats 🎧
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-zinc-800/80 px-2 py-0.5 rounded-md text-[11px] font-medium text-zinc-300">
                <Users className="w-3 h-3 text-sky-400" />
                <span>7 Watching</span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                SYNCED (0ms)
              </span>
            </div>
          </div>

          {/* Video Scene Screen */}
          <div className="relative h-44 sm:h-52 md:h-60 rounded-xl overflow-hidden bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 flex items-center justify-center group">
            {/* Ambient inner aura */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.2)_0%,transparent_70%)]" />

            {/* Floating Live Reaction Particles */}
            <div className="absolute bottom-6 left-6 animate-reaction-1 pointer-events-none text-lg">
              🔥
            </div>
            <div className="absolute bottom-10 left-12 animate-reaction-2 pointer-events-none text-lg">
              🍿
            </div>
            <div className="absolute bottom-8 left-20 animate-reaction-3 pointer-events-none text-lg">
              ❤️
            </div>

            {/* Play Button & Sound Equalizer */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-14 w-14 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 fill-zinc-950" />
                ) : (
                  <Play className="h-6 w-6 fill-zinc-950 ml-0.5" />
                )}
              </button>

              {/* Sound visualizer wave bars */}
              {isPlaying && (
                <div className="flex items-end gap-1 h-5">
                  <span className="w-1 bg-red-500 rounded-full animate-sound-wave-1" />
                  <span className="w-1 bg-amber-400 rounded-full animate-sound-wave-2" />
                  <span className="w-1 bg-white rounded-full animate-sound-wave-3" />
                  <span className="w-1 bg-red-400 rounded-full animate-sound-wave-4" />
                </div>
              )}
            </div>

            {/* Overlaid Floating Chat Card */}
            <div className="absolute bottom-3 right-3 z-20 w-56 sm:w-64 bg-zinc-950/90 border border-zinc-800 rounded-xl p-2.5 shadow-2xl backdrop-blur-md hidden sm:block">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800/80 text-[10px] text-zinc-400 font-semibold">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-white" /> Room Chat
                </span>
                <span className="text-emerald-400 font-bold">● Active</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="font-bold text-amber-400 text-[10px]">Sarah:</span>
                  <span className="bg-zinc-900 px-2 py-0.5 rounded-md text-zinc-200">
                    Synced perfectly! That drop was crazy 🔥
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="font-bold text-sky-400 text-[10px]">Alex:</span>
                  <span className="bg-zinc-900 px-2 py-0.5 rounded-md text-zinc-200">
                    Grabbing popcorn now 🍿
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scrubber timeline */}
          <div className="mt-3 space-y-1.5">
            <div className="relative h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-white w-[64%] rounded-full" />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>12:45</span>
              <span className="text-zinc-300 font-sans font-semibold">1080p • 60fps • 0 Buffering</span>
              <span>19:30</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Metrics Bar */}
      <div className="relative z-10 pt-4 border-t border-zinc-900 grid grid-cols-3 gap-4">
        <div className="showcase-metric space-y-0.5">
          <span className="text-xl sm:text-2xl font-black text-white block">
            &lt; 5ms
          </span>
          <span className="text-[11px] text-zinc-400 font-medium">Sync Latency</span>
        </div>

        <div className="showcase-metric space-y-0.5">
          <span className="text-xl sm:text-2xl font-black text-white block">
            10,000+
          </span>
          <span className="text-[11px] text-zinc-400 font-medium">Watch Rooms</span>
        </div>

        <div className="showcase-metric space-y-0.5">
          <div className="flex items-center gap-1">
            <span className="text-xl sm:text-2xl font-black text-white">4.9</span>
            <div className="flex text-amber-400 text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium">Host Rating</span>
        </div>
      </div>
    </div>
  );
}
