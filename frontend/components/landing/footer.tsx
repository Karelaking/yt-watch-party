"use client";

import * as React from "react";
import { Play, ArrowUp } from "lucide-react";

export function Footer(): React.JSX.Element {
  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white py-12 px-4 select-none">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Logo & Tagline */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-zinc-950 text-white flex items-center justify-center font-bold text-xs">
            <Play className="h-3 w-3 fill-white ml-0.5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-zinc-900">
            WatchParty
          </span>
          <span className="text-xs text-zinc-400 ml-2">
            © {new Date().getFullYear()} All rights reserved.
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-xs font-medium text-zinc-500">
          <a href="#features" className="hover:text-zinc-900 transition-colors">
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-zinc-900 transition-colors"
          >
            How it works
          </a>
          <a
            href="#demo-screen"
            className="hover:text-zinc-900 transition-colors"
          >
            Live Demo
          </a>
          <a href="#faq" className="hover:text-zinc-900 transition-colors">
            FAQ
          </a>
        </div>

        {/* Scroll to top button */}
        <button
          onClick={scrollToTop}
          className="flex items-center gap-1 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>Top</span>
        </button>
      </div>
    </footer>
  );
}
