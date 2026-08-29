"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";

export function StatsMock(): React.JSX.Element {
  return (
    <div className="w-50 sm:w-55 text-zinc-900 dark:text-zinc-100 select-none">
      <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
        <span>Activity</span>
        <span className="text-zinc-500 dark:text-zinc-400 font-normal">Weekly Sync</span>
      </div>

      {/* Mini SVG Smooth Wave / Sparkline chart */}
      <div className="h-16 w-full my-1">
        <svg
          viewBox="0 0 200 60"
          className="w-full h-full overflow-visible"
          fill="none"
        >
          <path
            d="M 0 45 C 30 45, 45 20, 75 25 C 105 30, 120 5, 150 15 C 175 25, 185 10, 200 8"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="text-zinc-900 dark:text-white"
          />
          <path
            d="M 0 45 C 30 45, 45 20, 75 25 C 105 30, 120 5, 150 15 C 175 25, 185 10, 200 8 L 200 60 L 0 60 Z"
            fill="url(#gradient-stats)"
            opacity="0.12"
          />
          <defs>
            <linearGradient id="gradient-stats" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" className="text-zinc-900 dark:text-white" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex items-baseline justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">99.8%</span>
          <span className="text-[10px] block text-zinc-400 dark:text-zinc-500 font-medium -mt-1">Sync Stability</span>
        </div>
        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
          <TrendingUp className="w-3 h-3" /> +14.2%
        </span>
      </div>
    </div>
  );
}
