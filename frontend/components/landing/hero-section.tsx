"use client";

import * as React from "react";
import Link from "next/link";
import { HighlightHeading } from "@/components/ds/highlight-heading";
import { SocialProof } from "@/components/ds/social-proof";
import { PillButton } from "@/components/ds/pill-button";
import { FloatingCard } from "@/components/ds/floating-card";
import { StatsMock } from "./stats-mock";
import { RoomsMock } from "./rooms-mock";
import { VideoPlayerMock } from "./video-player-mock";
import { ChatMock } from "./chat-mock";
import { Sparkles, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function HeroSection(): React.JSX.Element {
  const heroRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!heroRef.current) return;

      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

      heroTl
        .fromTo(
          ".hero-title-line-1 .hero-word",
          { opacity: 0, y: 32, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.07 }
        )
        .fromTo(
          ".hero-title-line-1 .hero-pill",
          { opacity: 0, scale: 0.7, y: 22 },
          { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(2)" },
          "-=0.35"
        )
        .fromTo(
          ".hero-title-line-2 .hero-word",
          { opacity: 0, y: 32, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.07 },
          "-=0.35"
        )
        .fromTo(
          ".hero-title-line-2 .hero-emoji",
          { opacity: 0, scale: 0, rotation: -25 },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.55,
            ease: "back.out(2.2)",
          },
          "-=0.35"
        )
        .fromTo(
          ".hero-subtext",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, stagger: 0.1, duration: 0.5 },
          "-=0.2"
        )
        .fromTo(
          ".hero-actions",
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5 },
          "-=0.2"
        )
        .fromTo(
          ".hero-floating-card",
          { opacity: 0, scale: 0.8, y: 30 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.7,
            ease: "back.out(1.5)",
          },
          "-=0.3"
        );

      // Scroll-driven Parallax Animations for Hero Mockup Cards
      gsap.to(".hero-card-left", {
        y: 160,
        x: -45,
        rotate: -15,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      gsap.to(".hero-card-center", {
        y: 90,
        scale: 0.92,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      gsap.to(".hero-card-right", {
        y: 180,
        x: 45,
        rotate: 15,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      gsap.to(".hero-card-chat", {
        y: 130,
        x: 35,
        rotate: -8,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    },
    { scope: heroRef }
  );

  return (
    <section
      ref={heroRef}
      className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto w-full flex flex-col items-center text-center overflow-hidden"
    >
      {/* Brandly-style Headline strictly in 2 lines with generous vertical space between lines */}
      <div className="hero-heading-block max-w-7xl mx-auto px-4 my-16 sm:my-20">
        <HighlightHeading
          as="h1"
          animateOnLoad={true}
          className="text-center select-none space-y-3 sm:space-y-4 md:space-y-6"
        >
          {/* Line 1 */}
          <div className="hero-title-line-1 flex items-center justify-center flex-wrap gap-x-2 sm:gap-x-3.5 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[70px] font-extrabold tracking-tight leading-[1.12]">
            <span className="hero-word text-zinc-950 dark:text-white inline-block">Watch</span>
            <span className="hero-pill pill-highlight text-zinc-950 dark:text-white inline-block">
              Together
            </span>
            <span className="hero-word text-zinc-400 dark:text-zinc-400 font-medium inline-block">
              and
            </span>
            <span className="hero-word text-zinc-400 dark:text-zinc-400 font-medium inline-block">
              Sync
            </span>
            <span className="hero-word text-zinc-400 dark:text-zinc-400 font-medium inline-block">
              Creative
            </span>
          </div>
          {/* Line 2 */}
          <div className="hero-title-line-2 flex items-center justify-center flex-wrap gap-x-2 sm:gap-x-3.5 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[70px] font-extrabold tracking-tight leading-[1.12]">
            <span className="hero-word text-zinc-950 dark:text-white inline-block">Moments</span>
            <span className="hero-emoji inline-block text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[72px] mx-1 align-middle select-none transition-transform hover:scale-125 duration-200 cursor-pointer">
              🍿
            </span>
            <span className="hero-word text-zinc-950 dark:text-white inline-block">With</span>
            <span className="hero-word text-zinc-950 dark:text-white inline-block">Your</span>
            <span className="hero-word text-zinc-950 dark:text-white inline-block">Friends!</span>
          </div>
        </HighlightHeading>
      </div>

      {/* Subtitle */}
      <p className="hero-subtext max-w-xl mx-auto mt-6 text-sm sm:text-base text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
        The ultimate web platform for synchronized YouTube watch parties.
        Frame-perfect playback, low-latency live chat, and instant room sharing
        for creators and friends.
      </p>

      {/* Social Proof Star Ratings & Avatars */}
      <div className="hero-subtext mt-7">
        <SocialProof
          rating={4.9}
          trustedCount="Trusted by 10,000+ Party Hosts & Streamers"
        />
      </div>

      {/* Hero Action CTA Buttons */}
      <div className="hero-actions flex flex-wrap items-center justify-center gap-3.5 mt-8 z-20">
        <Link href="/sign-up">
          <PillButton
            variant="default"
            pulse={true}
            confettiOnClick={true}
            className="text-sm px-7 py-3 cursor-pointer"
            icon={<Sparkles className="w-4 h-4" />}
          >
            Start a Party 🎉
          </PillButton>
        </Link>

        <a href="#how-it-works">
          <PillButton
            variant="outline"
            className="text-sm px-6 py-3"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            View Workflow
          </PillButton>
        </a>
      </div>

      {/* ===================== FLOATING CARDS (Parallax & Tilt) ===================== */}
      <div className="relative w-full max-w-6xl mt-12 sm:mt-16 min-h-115 sm:min-h-130 md:min-h-140 flex items-center justify-center">
        {/* Background subtle radial ambient glow */}
        <div className="absolute inset-0 bg-radial from-zinc-200/50 dark:from-zinc-800/30 via-transparent to-transparent blur-3xl pointer-events-none -z-10" />

        {/* Left Tilted Card - Stats & Activity */}
        <div className="hero-floating-card absolute left-0 sm:left-4 md:left-8 lg:left-12 top-4 sm:top-10 z-10 hidden md:block">
          <div className="hero-card-left">
            <FloatingCard rotate={-6} floatReverse={false}>
              <StatsMock />
            </FloatingCard>
          </div>
        </div>

        {/* Center Main Card - Video Player Preview */}
        <div className="hero-floating-card relative z-20 mx-auto">
          <div className="hero-card-center">
            <FloatingCard
              rotate={0}
              className="p-4 sm:p-5 shadow-2xl border-zinc-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              <VideoPlayerMock />
            </FloatingCard>
          </div>
        </div>

        {/* Right Tilted Card - Live Rooms */}
        <div className="hero-floating-card absolute right-0 sm:right-4 md:right-8 lg:left-auto lg:right-12 top-6 sm:top-12 z-10 hidden md:block">
          <div className="hero-card-right">
            <FloatingCard rotate={6} floatReverse={true}>
              <RoomsMock />
            </FloatingCard>
          </div>
        </div>

        {/* Bottom Right Floating Chat Card */}
        <div className="hero-floating-card absolute right-2 sm:right-8 md:right-16 lg:right-20 bottom-2 sm:bottom-4 z-30 hidden lg:block">
          <div className="hero-card-chat">
            <FloatingCard rotate={-3} floatReverse={false}>
              <ChatMock />
            </FloatingCard>
          </div>
        </div>
      </div>
    </section>
  );
}
