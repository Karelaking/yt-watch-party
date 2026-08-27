"use client";

import * as React from "react";
import { Play, Pause, Users} from "lucide-react";
import { YouTubeIcon } from "@/components/ds/brand-icons";

export function VideoPlayerMock(): React.JSX.Element {
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [progress, setProgress] = React.useState(68);

  return (
    <div className="w-75 sm:w-95 md:w-110 text-zinc-900 select-none">
      {/* Player header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
            <YouTubeIcon className="w-4 h-4 text-red-600 fill-red-600" /> Synced
            Stream
          </span>
        </div>
        <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
          HD 1080p • 60fps
        </span>
      </div>

      {/* Video Display Box */}
      <div className="relative h-40 sm:h-48 md:h-52 rounded-xl overflow-hidden bg-linear-to-tr from-zinc-950 via-zinc-900 to-zinc-800 flex items-center justify-center group shadow-inner">
        {/* Background ambient lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.25)_0%,transparent_70%)]" />

        {/* Video mock graphics */}
        <div className="absolute top-3 left-3 text-[11px] font-semibold text-white/90 bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          Room #party-391
        </div>

        {/* Big play/pause center button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="relative z-10 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/90 hover:bg-white text-zinc-950 flex items-center justify-center shadow-2xl transition-transform duration-200 hover:scale-110 active:scale-95 cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 sm:h-6 sm:w-6 fill-zinc-950" />
          ) : (
            <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-zinc-950 ml-0.5" />
          )}
        </button>

        {/* Viewer count pill inside player */}
        <div className="absolute bottom-3 right-3 text-[11px] font-semibold text-white bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-white" /> 6 Friends
        </div>
      </div>

      {/* Timeline scrub bar */}
      <div className="mt-3.5 space-y-1.5">
        <div className="relative h-2 w-full bg-zinc-100 rounded-full overflow-hidden cursor-pointer group">
          <div
            className="h-full bg-zinc-900 rounded-full transition-all duration-300 group-hover:bg-red-600"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
          <span>14:28</span>
          <span className="text-zinc-800 font-bold">Lofi Chill Beats ☕</span>
          <span>21:10</span>
        </div>
      </div>
    </div>
  );
}
