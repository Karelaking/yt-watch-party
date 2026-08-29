"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PillButton } from "./pill-button";
import { Play, Menu, X } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ThemeToggle } from "./theme-toggle";

export type GlassNavProps = React.HTMLAttributes<HTMLElement>;

export function GlassNav({ className, ...props }: GlassNavProps): React.JSX.Element {
  const navRef = React.useRef<HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  const scrolledRef = React.useRef(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 30;
      if (isScrolled !== scrolledRef.current) {
        scrolledRef.current = isScrolled;
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useGSAP(
    () => {
      if (!navRef.current) return;
      gsap.from(navRef.current, {
        y: -12,
        opacity: 0.8,
        duration: 0.4,
        ease: "power2.out",
      });
    },
    { scope: navRef }
  );

  return (
    <header
      ref={navRef}
      className={cn(
        "sticky top-4 z-50 w-full max-w-6xl mx-auto px-3 sm:px-4 transition-all duration-300",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 rounded-full transition-all duration-300 select-none",
          // Sleek capsule style supporting both light and dark modes
          "bg-white/90 dark:bg-zinc-950/90 text-zinc-900 dark:text-white shadow-xl shadow-zinc-950/5 dark:shadow-zinc-950/30 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-lg",
          scrolled && "shadow-2xl border-zinc-300 dark:border-zinc-700/80"
        )}
      >
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold text-xs shadow-xs transition-transform duration-300 group-hover:scale-105">
            <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current ml-0.5" />
          </div>
          <span className="font-bold text-sm sm:text-base tracking-tight text-zinc-950 dark:text-white group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
            WatchParty
          </span>
        </a>

        {/* Desktop Nav Items */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-zinc-600 dark:text-zinc-300"
        >
          <a
            href="#features"
            className="hover:text-zinc-950 dark:hover:text-white transition-colors duration-200"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-zinc-950 dark:hover:text-white transition-colors duration-200"
          >
            How it Works
          </a>
          <a
            href="#sync-tech"
            className="hover:text-zinc-950 dark:hover:text-white transition-colors duration-200 flex items-center gap-1"
          >
            Integrations
          </a>
          <a
            href="#reviews"
            className="hover:text-zinc-950 dark:hover:text-white transition-colors duration-200"
          >
            Reviews
          </a>
          <a
            href="#faq"
            className="hover:text-zinc-950 dark:hover:text-white transition-colors duration-200"
          >
            FAQ
          </a>
        </nav>

        {/* Right Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white px-3 py-1.5 transition-colors cursor-pointer"
            >
              Sign In
            </Link>
            <Link href="/sign-up">
              <PillButton
                variant="outline"
                className="bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 border-none py-1.5 px-4 text-xs font-semibold shadow-xs"
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
                className="bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 border-none py-1.5 px-4 text-xs font-semibold shadow-xs"
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
          <ThemeToggle className="h-8 w-8" />
        </div>

        {/* Mobile Right Controls: Quick ThemeToggle + Hamburger */}
        <div className="flex md:hidden items-center gap-1.5">
          <ThemeToggle className="h-7 w-7 sm:h-8 sm:w-8" />
          <button
            type="button"
            className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-panel"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <nav
        id="mobile-nav-panel"
        aria-label="Mobile Navigation"
        aria-hidden={!mobileMenuOpen}
        className={cn(
          "md:hidden mt-2 p-4 rounded-3xl bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-2xl backdrop-blur-xl flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200",
          !mobileMenuOpen && "hidden"
        )}
      >
        <a
          href="#features"
          className="py-2 px-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          Features
        </a>
        <a
          href="#how-it-works"
          className="py-2 px-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          How it Works
        </a>
        <a
          href="#sync-tech"
          className="py-2 px-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          Integrations
        </a>
        <a
          href="#reviews"
          className="py-2 px-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          Reviews
        </a>
        <a
          href="#faq"
          className="py-2 px-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          FAQ
        </a>
        <div className="pt-2.5 mt-1 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="w-full text-center py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-sm font-semibold text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
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
                className="w-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 border-none font-semibold justify-center shadow-xs"
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
            >
              <PillButton
                variant="outline"
                className="w-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 border-none font-bold justify-center shadow-xs"
              >
                Go to Dashboard
              </PillButton>
            </Link>
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Account</span>
              <UserButton />
            </div>
          </Show>
        </div>
      </nav>
    </header>
  );
}
