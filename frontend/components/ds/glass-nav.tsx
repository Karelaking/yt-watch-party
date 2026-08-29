"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PillButton } from "./pill-button";
import { Play, Sparkles, ChevronDown, Menu, X, Users } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export type GlassNavProps = React.HTMLAttributes<HTMLElement>;

export function GlassNav({ className, ...props }: GlassNavProps): React.JSX.Element {
  const navRef = React.useRef<HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useGSAP(
    () => {
      if (!navRef.current) return;
      gsap.fromTo(
        navRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay: 0.05 }
      );
    },
    { scope: navRef }
  );

  return (
    <header
      ref={navRef}
      className={cn(
        "sticky top-4 z-50 w-full max-w-6xl mx-auto px-4 transition-all duration-300",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex items-center justify-between px-5 py-3 rounded-full transition-all duration-300 select-none",
          // Dark sleek capsule style matching the Brandly top bar
          "bg-zinc-950 text-white shadow-xl shadow-zinc-950/20 border border-zinc-800/80 backdrop-blur-lg"
        )}
      >
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="h-8 w-8 rounded-full bg-white text-zinc-950 flex items-center justify-center font-bold text-xs shadow-xs transition-transform duration-300 group-hover:scale-105">
            <Play className="h-3.5 w-3.5 fill-zinc-950 text-zinc-950 ml-0.5" />
          </div>
          <span className="font-bold text-base tracking-tight text-white group-hover:text-zinc-200 transition-colors">
            WatchParty
          </span>
        </a>

        {/* Desktop Nav Items */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-300"
        >
          <a
            href="#features"
            className="hover:text-white transition-colors duration-200"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-white transition-colors duration-200"
          >
            How it Works
          </a>
          <a
            href="#sync-tech"
            className="hover:text-white transition-colors duration-200 flex items-center gap-1"
          >
            Integrations
          </a>
          <a
            href="#reviews"
            className="hover:text-white transition-colors duration-200"
          >
            Reviews
          </a>
          <a
            href="#faq"
            className="hover:text-white transition-colors duration-200"
          >
            FAQ
          </a>
        </nav>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="text-xs font-semibold text-zinc-300 hover:text-white px-3 py-1.5 transition-colors cursor-pointer"
            >
              Sign In
            </Link>
            <Link href="/sign-up">
              <PillButton
                variant="outline"
                className="bg-white text-zinc-950 hover:bg-zinc-100 hover:text-black border-none py-1.5 px-4 text-xs font-semibold shadow-xs"
                confettiOnClick={true}
              >
                Sign Up
              </PillButton>
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">
              <PillButton
                variant="outline"
                className="bg-white text-zinc-950 hover:bg-zinc-100 hover:text-black border-none py-1.5 px-4 text-xs font-semibold shadow-xs"
              >
                Dashboard
              </PillButton>
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </Show>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          className="md:hidden text-zinc-300 hover:text-white p-1 cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-panel"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <nav
        id="mobile-nav-panel"
        aria-label="Mobile Navigation"
        aria-hidden={!mobileMenuOpen}
        className={cn(
          "md:hidden mt-2 p-4 rounded-3xl bg-zinc-950 border border-zinc-800 text-white shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200",
          !mobileMenuOpen && "hidden"
        )}
      >
        <a
          href="#features"
          className="py-2 px-3 rounded-lg hover:bg-zinc-900 text-sm font-medium"
          onClick={() => setMobileMenuOpen(false)}
        >
          Features
        </a>
        <a
          href="#how-it-works"
          className="py-2 px-3 rounded-lg hover:bg-zinc-900 text-sm font-medium"
          onClick={() => setMobileMenuOpen(false)}
        >
          How it Works
        </a>
        <a
          href="#sync-tech"
          className="py-2 px-3 rounded-lg hover:bg-zinc-900 text-sm font-medium"
          onClick={() => setMobileMenuOpen(false)}
        >
          Integrations
        </a>
        <a
          href="#reviews"
          className="py-2 px-3 rounded-lg hover:bg-zinc-900 text-sm font-medium"
          onClick={() => setMobileMenuOpen(false)}
        >
          Reviews
        </a>
        <a
          href="#faq"
          className="py-2 px-3 rounded-lg hover:bg-zinc-900 text-sm font-medium"
          onClick={() => setMobileMenuOpen(false)}
        >
          FAQ
        </a>
        <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="w-full text-center py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-sm font-medium text-white transition-colors cursor-pointer"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              onClick={() => setMobileMenuOpen(false)}
            >
              <PillButton
                variant="outline"
                className="w-full bg-white text-zinc-950 hover:bg-zinc-100 border-none font-semibold justify-center"
                confettiOnClick={true}
              >
                Sign Up
              </PillButton>
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 px-3 rounded-lg bg-white text-zinc-950 font-bold text-sm transition-colors cursor-pointer"
            >
              Go to Dashboard
            </Link>
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 rounded-lg">
              <span className="text-sm font-medium text-zinc-300">Account</span>
              <UserButton />
            </div>
          </Show>
        </div>
      </nav>
    </header>
  );
}
