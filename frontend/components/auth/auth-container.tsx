"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Play, ShieldCheck } from "lucide-react";
import { AuthShowcase } from "./auth-showcase";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

interface AuthContainerProps {
  mode: "sign-in" | "sign-up";
  children: React.ReactNode;
}

export function AuthContainer({
  mode,
  children,
}: AuthContainerProps): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        ".auth-header-nav",
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.5 }
      )
        .fromTo(
          ".auth-form-card",
          { opacity: 0, y: 20, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6 },
          "-=0.3"
        );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white text-zinc-950 font-sans selection:bg-zinc-900 selection:text-white"
    >
      {/* Left Column: Full-Height Dark Cinema Showcase (Hidden on mobile, 7 cols on LG) */}
      <div className="hidden lg:block lg:col-span-7 xl:col-span-7 bg-zinc-950 border-r border-zinc-800/80 relative min-h-screen">
        <AuthShowcase />
      </div>

      {/* Right Column: Form Panel (12 cols on mobile, 5 cols on LG) */}
      <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 min-h-screen bg-white relative overflow-y-auto">
        {/* Top Header Navigation */}
        <div className="auth-header-nav flex items-center justify-between w-full pb-6 border-b border-zinc-100">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-zinc-700 bg-zinc-100/90 border border-zinc-200 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all duration-200 cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>Back to Home</span>
          </Link>

          {/* Logo on mobile/desktop */}
          <Link
            href="/"
            className="flex items-center gap-2 group cursor-pointer lg:hidden"
          >
            <div className="h-7 w-7 rounded-full bg-zinc-950 text-white flex items-center justify-center font-bold text-xs">
              <Play className="h-3 w-3 fill-white ml-0.5" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-950">
              WatchParty
            </span>
          </Link>
        </div>

        {/* Form Center Wrapper */}
        <div className="auth-form-card my-auto py-8 w-full max-w-md mx-auto">
          {/* Segmented Switcher */}
          <div className="mb-6 p-1 rounded-2xl bg-zinc-100 border border-zinc-200 grid grid-cols-2 text-center text-xs font-semibold select-none shadow-inner">
            <Link
              href="/sign-in"
              className={cn(
                "py-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5",
                mode === "sign-in"
                  ? "bg-white text-zinc-950 shadow-md shadow-zinc-950/5 font-bold"
                  : "text-zinc-500 hover:text-zinc-950 hover:bg-white/50"
              )}
            >
              <span>Sign In</span>
            </Link>
            <Link
              href="/sign-up"
              className={cn(
                "py-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5",
                mode === "sign-up"
                  ? "bg-white text-zinc-950 shadow-md shadow-zinc-950/5 font-bold"
                  : "text-zinc-500 hover:text-zinc-950 hover:bg-white/50"
              )}
            >
              <span>Create Account</span>
            </Link>
          </div>

          {/* Clerk Component Form Mount */}
          <div className="w-full flex justify-center">{children}</div>
        </div>

        {/* Bottom Legal / Trust Notice */}
        <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
            <span>Encrypted • Clerk Authentication</span>
          </div>
          <span>© {new Date().getFullYear()} WatchParty</span>
        </div>
      </div>
    </div>
  );
}
