"use client";

import * as React from "react";
import Link from "next/link";
import { Room } from "@/lib/contract-types";
import { ArrowLeft, Copy, Check, Users, Share2, Settings, Monitor } from "lucide-react";
import { ThemeToggle } from "@/components/ds/theme-toggle";

interface RoomHeaderProps {
  room: Room;
  isHost: boolean;
  onOpenSettings: () => void;
  onOpenInvite: () => void;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
}

export function RoomHeader({
  room,
  isHost,
  onOpenSettings,
  onOpenInvite,
  isScreenSharing,
  onToggleScreenShare,
}: RoomHeaderProps): React.JSX.Element {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800/80 px-4 sm:px-6 h-14 flex items-center justify-between gap-4 select-none z-30">
      {/* Left: Back & Room Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="flex items-center gap-2">
          <h1 className="font-bold text-sm tracking-tight text-zinc-950 dark:text-white truncate max-w-xs sm:max-w-md">
            {room.name}
          </h1>

          <button
            onClick={handleCopyLink}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded transition-colors cursor-pointer"
            title="Copy room code"
          >
            <span>{room.code}</span>
            {copied ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
            )}
          </button>
        </div>
      </div>

      {/* Right: Sync Status & Actions */}
      <div className="flex items-center gap-2">
        {/* Sync Status Badge */}
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-md text-xs text-zinc-700 dark:text-zinc-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Synced</span>
        </div>

        {/* Watchers Counter */}
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-md text-xs text-zinc-700 dark:text-zinc-300">
          <Users className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
          <span className="text-[11px]">{room.memberships.length}</span>
        </div>

        {/* Screen Share Button */}
        {room.settings.allowScreenShare && (
          <button
            onClick={onToggleScreenShare}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
              isScreenSharing
                ? "bg-red-600 border-red-500 text-white"
                : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
            }`}
            title="Screen Sharing"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Settings — Host Only */}
        {isHost && (
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
            title="Room Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Invite Modal Trigger */}
        <button
          onClick={onOpenInvite}
          className="bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
        >
          <Share2 className="w-3 h-3" />
          <span>Invite</span>
        </button>
      </div>
    </header>
  );
}
