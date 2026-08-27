"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Play } from "lucide-react";
import {
  YouTubeIcon,
  DiscordIcon,
  TwitchIcon,
  ChromeIcon,
  SpatialAudioIcon,
  ZeroLagIcon,
  RoleControlsIcon,
  MagicLinkIcon,
} from "./brand-icons";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type LogoOrbitProps = React.HTMLAttributes<HTMLDivElement>;

export function LogoOrbit({ className, ...props }: LogoOrbitProps): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const centerHubRef = React.useRef<HTMLDivElement>(null);

  // Exact positions set by user preserved strictly:
  const satellites = [
    {
      name: "YouTube 4K",
      icon: <YouTubeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF0000]" />,
      tag: "4K 60fps",
      color: "bg-red-50 text-red-600 border-red-200 hover:border-red-400 shadow-red-500/10",
      x: 35,
      y: 120,
      path: "M 500 300 C 380 300, 180 230, 35 120",
      pulseColor: "#ef4444",
    },
    {
      name: "Discord Sync",
      icon: <DiscordIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#5865F2]" />,
      tag: "Voice & Chat",
      color: "bg-indigo-50 text-indigo-600 border-indigo-200 hover:border-indigo-400 shadow-indigo-500/10",
      x: 125,
      y: 65,
      path: "M 500 300 C 410 270, 260 180, 125 65",
      pulseColor: "#6366f1",
    },
    {
      name: "Twitch Live",
      icon: <TwitchIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#9146FF]" />,
      tag: "Live Streams",
      color: "bg-purple-50 text-purple-600 border-purple-200 hover:border-purple-400 shadow-purple-500/10",
      x: 270,
      y: 35,
      path: "M 500 300 C 440 240, 360 140, 270 35",
      pulseColor: "#a855f7",
    },
    {
      name: "Spatial Audio",
      icon: <SpatialAudioIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />,
      tag: "3D Sound",
      color: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400 shadow-emerald-500/10",
      x: 395,
      y: 15,
      path: "M 500 300 C 475 210, 445 110, 395 15",
      pulseColor: "#10b981",
    },
    {
      name: "Zero Lag Sync",
      icon: <ZeroLagIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />,
      tag: "< 15ms Delta",
      color: "bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400 shadow-amber-500/10",
      x: 515,
      y: 15,
      path: "M 500 300 C 525 210, 555 110, 515 15",
      pulseColor: "#f59e0b",
    },
    {
      name: "Role Controls",
      icon: <RoleControlsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />,
      tag: "Host Only",
      color: "bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400 shadow-blue-500/10",
      x: 640,
      y: 35,
      path: "M 500 300 C 560 240, 640 140, 640 35",
      pulseColor: "#3b82f6",
    },
    {
      name: "Chrome PWA",
      icon: <ChromeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />,
      tag: "No Extension",
      color: "bg-sky-50 text-sky-600 border-sky-200 hover:border-sky-400 shadow-sky-500/10",
      x: 760,
      y: 75,
      path: "M 500 300 C 590 270, 740 180, 760 75",
      pulseColor: "#0ea5e9",
    },
    {
      name: "Magic Link",
      icon: <MagicLinkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />,
      tag: "1-Click Join",
      color: "bg-rose-50 text-rose-600 border-rose-200 hover:border-rose-400 shadow-rose-500/10",
      x: 905,
      y: 110,
      path: "M 500 300 C 620 300, 820 230, 905 110",
      pulseColor: "#f43f5e",
    },
  ];

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const satellitesEls = containerRef.current.querySelectorAll(".satellite-node");
      const glowPaths = containerRef.current.querySelectorAll(".orbit-glow-path");
      const basePaths = containerRef.current.querySelectorAll(".orbit-base-path");
      const hubRipples = containerRef.current.querySelectorAll(".hub-ripple");
      const center = centerHubRef.current;

      // 1. Initial State
      gsap.set(satellitesEls, { scale: 0.3, opacity: 0 });
      gsap.set(center, { scale: 0.3, opacity: 0, rotation: -20 });
      gsap.set(hubRipples, { scale: 0.5, opacity: 0 });

      // 2. Entrance timeline triggered when section is reached
      const entranceTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
          once: true,
        },
      });

      entranceTl
        // Center hub spring in
        .to(center, {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 0.7,
          ease: "back.out(2)",
        })
        // Radiate ripple rings
        .to(
          hubRipples,
          {
            scale: 1,
            opacity: 1,
            stagger: 0.1,
            duration: 0.6,
            ease: "power2.out",
          },
          "-=0.4"
        )
        // Satellite nodes pop in from center outwards
        .to(
          satellitesEls,
          {
            scale: 1,
            opacity: 1,
            stagger: {
              each: 0.05,
              from: "center",
            },
            duration: 0.6,
            ease: "back.out(1.8)",
          },
          "-=0.3"
        );

      // 3. Scroll-Driven SVG Path Draw & Dash Parallax Scrub
      // As the user scrolls down, the glow paths actively draw outward toward each node
      gsap.fromTo(
        glowPaths,
        { strokeDashoffset: 500 },
        {
          strokeDashoffset: 0,
          ease: "none",
          stagger: 0.03,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            end: "bottom 40%",
            scrub: 1,
          },
        }
      );

      // Base dashed paths stream dashes with scroll
      gsap.to(basePaths, {
        strokeDashoffset: -120,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full max-w-5xl mx-auto min-h-95 sm:min-h-105 md:min-h-115 aspect-1000/380 select-none",
        className
      )}
      {...props}
    >
      {/* SVG Connecting Radiating Curves with Animated Glowing Strokes and Traveling Pulses */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
        viewBox="0 0 1000 380"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradients for each radiating connector curve */}
          {satellites.map((sat, i) => (
            <linearGradient
              key={`grad-${i}`}
              id={`path-grad-${i}`}
              x1="500"
              y1="300"
              x2={sat.x}
              y2={sat.y}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#18181b" stopOpacity="0.8" />
              <stop offset="70%" stopColor={sat.pulseColor} stopOpacity="0.7" />
              <stop offset="100%" stopColor={sat.pulseColor} stopOpacity="0.3" />
            </linearGradient>
          ))}
        </defs>

        {/* Hub Concentric SVG Radar Ripple Rings */}
        <circle
          cx="500"
          cy="300"
          r="45"
          className="hub-ripple stroke-zinc-200/80 transition-all"
          strokeWidth="1.25"
          strokeDasharray="4 4"
        />
        <circle
          cx="500"
          cy="300"
          r="80"
          className="hub-ripple hub-ripple-outer stroke-zinc-200/60 transition-all"
          strokeWidth="1"
          strokeDasharray="6 6"
        />
        <circle
          cx="500"
          cy="300"
          r="115"
          className="hub-ripple hub-ripple-outer stroke-zinc-200/40 transition-all"
          strokeWidth="0.75"
          strokeDasharray="8 8"
        />

        {/* Render each curved path with base track, scroll-drawing glow overlay, and traveling energy packet */}
        {satellites.map((sat, i) => (
          <g key={`orbit-line-group-${i}`}>
            {/* 1. Base dashed track */}
            <path
              id={`track-${i}`}
              className="orbit-base-path stroke-zinc-200/90"
              d={sat.path}
              strokeWidth="1.25"
              strokeDasharray="4 4"
            />

            {/* 2. Scroll-drawn active glow path */}
            <path
              className="orbit-glow-path"
              d={sat.path}
              stroke={`url(#path-grad-${i})`}
              strokeWidth="1.75"
              strokeDasharray="500"
              strokeDashoffset="500"
              strokeLinecap="round"
            />

            {/* 3. Real-time traveling energy particle gliding from Hub to Satellite along the path */}
            <circle r="3.5" fill={sat.pulseColor} opacity="0.9">
              <animateMotion
                dur={`${2.2 + (i % 3) * 0.3}s`}
                repeatCount="indefinite"
                path={sat.path}
                keyPoints="0;1"
                keyTimes="0;1"
              />
            </circle>
          </g>
        ))}
      </svg>

      {/* Satellites positioned with EXACT mathematical coordinates matching SVG endpoints */}
      {satellites.map((sat, i) => (
        <div
          key={i}
          className="satellite-node absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-10"
          style={{
            left: `${(sat.x / 1000) * 100}%`,
            top: `${(sat.y / 380) * 100}%`,
          }}
        >
          <div
            className={cn(
              "relative h-13 w-13 sm:h-15 sm:w-15 md:h-16 md:w-16 rounded-2xl border flex flex-col items-center justify-center shadow-xs bg-white text-lg sm:text-xl md:text-2xl transition-all duration-300 group-hover:scale-115 group-hover:shadow-lg group-hover:-translate-y-1.5",
              sat.color
            )}
          >
            <span>{sat.icon}</span>
            <span className="text-[8px] sm:text-[9px] font-bold text-zinc-500 scale-90 group-hover:text-zinc-900 group-hover:scale-100 transition-all -mt-0.5 whitespace-nowrap">
              {sat.tag}
            </span>
          </div>
          <span className="mt-1.5 text-[11px] sm:text-xs font-semibold text-zinc-700 bg-white/90 px-2 py-0.5 rounded-full border border-zinc-200/80 shadow-2xs text-center whitespace-nowrap group-hover:text-zinc-950 group-hover:bg-white transition-colors">
            {sat.name}
          </span>
        </div>
      ))}

      {/* Center WatchParty Hub anchored precisely at (500, 300) */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 flex justify-center items-center z-20"
        style={{
          left: "50%",
          top: `${(300 / 380) * 100}%`,
        }}
      >
        {/* Radiating Ambient Energy Glow */}
        <div className="absolute h-36 w-36 rounded-full bg-red-500/10 blur-xl pointer-events-none -z-10 animate-pulse" />

        <div
          ref={centerHubRef}
          className="relative flex items-center justify-center h-20 w-20 sm:h-22 sm:w-22 rounded-3xl bg-zinc-950 text-white shadow-2xl shadow-zinc-950/40 border-2 border-zinc-800 cursor-pointer group transition-transform duration-300 hover:scale-110 active:scale-95"
        >
          {/* Subtle pulse aura */}
          <div className="absolute inset-0 rounded-3xl bg-zinc-900 animate-ping opacity-20" />
          
          <div className="relative flex flex-col items-center justify-center">
            <Play className="h-8 w-8 sm:h-9 sm:w-9 fill-white text-white ml-1 transition-transform group-hover:scale-115" />
            <span className="text-[8px] font-bold tracking-widest uppercase text-zinc-400 mt-0.5">
              SYNC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
