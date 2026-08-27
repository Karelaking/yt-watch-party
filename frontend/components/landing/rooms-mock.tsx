"use client";

import * as React from "react";
import { Tv, Zap } from "lucide-react";

export function RoomsMock(): React.JSX.Element {
  return (
    <div className="w-47.5 sm:w-52.5 text-zinc-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
        <span>Live Overview</span>
        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span className="text-2xl font-black tracking-tight text-zinc-900">4,820+</span>
        <span className="text-[10px] text-zinc-500 font-semibold">Active Viewers</span>
      </div>

      {/* Mini metric pills */}
      <div className="space-y-1.5 pt-2 border-t border-zinc-100 text-xs">
        <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-zinc-50 border border-zinc-100">
          <span className="flex items-center gap-1.5 text-zinc-600 text-[11px] font-medium">
            <Tv className="w-3 h-3 text-zinc-900" /> YouTube Rooms
          </span>
          <span className="font-bold text-zinc-900 text-[11px]">842</span>
        </div>

        <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-zinc-50 border border-zinc-100">
          <span className="flex items-center gap-1.5 text-zinc-600 text-[11px] font-medium">
            <Zap className="w-3 h-3 text-amber-500" /> Avg. Latency
          </span>
          <span className="font-bold text-emerald-600 text-[11px]">12ms</span>
        </div>
      </div>
    </div>
  );
}
