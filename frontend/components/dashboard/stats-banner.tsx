"use client";

import * as React from "react";
import { Radio, Users, Zap, Tv } from "lucide-react";

interface StatsBannerProps {
  activeRoomsCount: number;
  totalMembersCount: number;
}

export function StatsBanner({
  activeRoomsCount,
  totalMembersCount,
}: StatsBannerProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 select-none">
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
          <span>Active Rooms</span>
          <Radio className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-zinc-950">{activeRoomsCount}</span>
          <span className="text-[11px] font-semibold text-emerald-600">Live</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
          <span>Total Watchers</span>
          <Users className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-zinc-950">{totalMembersCount}</span>
          <span className="text-[11px] font-medium text-zinc-400">Online</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
          <span>Sync Precision</span>
          <Zap className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-zinc-950">0.01s</span>
          <span className="text-[11px] font-semibold text-emerald-600">Locked</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
          <span>Video Quality</span>
          <Tv className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-zinc-950">1080p</span>
          <span className="text-[11px] font-medium text-zinc-400">60 FPS</span>
        </div>
      </div>
    </div>
  );
}
