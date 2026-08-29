"use client";

import * as React from "react";
import type { MediaProvider } from "@/lib/contract-types";
import { YouTubeIcon } from "@/components/ds/brand-icons";
import { Radio, Tv, Monitor } from "lucide-react";

interface PlayerHeaderBarProps {
  provider: MediaProvider;
  title: string;
  activeView: "MEDIA" | "SCREEN";
  hasScreenStream: boolean;
  canControl: boolean;
  onSetViewMode: (mode: "MEDIA" | "SCREEN") => void;
  onToggleUrlInput: () => void;
}

export function PlayerHeaderBar({
  provider,
  title,
  activeView,
  hasScreenStream,
  canControl,
  onSetViewMode,
  onToggleUrlInput,
}: PlayerHeaderBarProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 text-xs z-30">
      <div className="flex items-center gap-2 truncate">
        {provider === "YOUTUBE" && (
          <YouTubeIcon className="w-3.5 h-3.5 fill-red-500 text-red-500 shrink-0" />
        )}
        {provider === "TWITCH" && (
          <Radio className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
        )}
        {provider === "VIMEO" && (
          <Tv className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
        )}
        {(provider === "DIRECT_URL" || provider === "HLS") && (
          <Tv className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
        )}

        <span className="font-semibold text-zinc-900 dark:text-zinc-200 truncate">
          {activeView === "SCREEN" ? "Screen Sharing Stream" : title}
        </span>
      </div>

      {/* View Switcher & Actions */}
      <div className="flex items-center gap-2">
        {hasScreenStream && (
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-[10px] font-bold">
            <button
              type="button"
              onClick={() => onSetViewMode("MEDIA")}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeView === "MEDIA"
                  ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              Media
            </button>
            <button
              type="button"
              onClick={() => onSetViewMode("SCREEN")}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                activeView === "SCREEN"
                  ? "bg-red-600 text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              <Monitor className="w-3 h-3" /> Screen
            </button>
          </div>
        )}

        {canControl && (
          <button
            type="button"
            onClick={onToggleUrlInput}
            className="text-[11px] text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-0.5 rounded transition-colors cursor-pointer border border-zinc-200 dark:border-transparent font-medium"
          >
            Change URL
          </button>
        )}

        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">
          Custom Sync Engine
        </span>
      </div>
    </div>
  );
}
