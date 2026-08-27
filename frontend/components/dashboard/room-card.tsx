"use client";

import * as React from "react";
import Link from "next/link";
import { Room } from "@/lib/contract-types";
import { Users, Play, Copy, Check, Lock, Globe, ArrowUpRight } from "lucide-react";

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps): React.JSX.Element {
  const [copied, setCopied] = React.useState(false);
  const currentMedia = room.media[0] || null;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/room/${room.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden select-none">
      {/* Video Thumbnail Viewport */}
      <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
        {currentMedia?.thumbnailUrl ? (
          <img
            src={currentMedia.thumbnailUrl}
            alt={room.name}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-102 transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500">
            <Play className="w-8 h-8" />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-semibold text-white border border-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>LIVE</span>
          </div>

          <div className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-medium text-zinc-300 border border-white/10 flex items-center gap-1">
            {room.visibility === "PUBLIC" ? (
              <>
                <Globe className="w-2.5 h-2.5 text-emerald-400" /> Public
              </>
            ) : (
              <>
                <Lock className="w-2.5 h-2.5 text-amber-400" /> Private
              </>
            )}
          </div>
        </div>

        {/* Bottom Room Code Overlay */}
        <div className="absolute bottom-2 right-2 z-10">
          <span className="text-[10px] font-mono font-semibold bg-black/70 text-zinc-300 px-2 py-0.5 rounded border border-white/10 backdrop-blur-xs">
            {room.code}
          </span>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <h3 className="font-bold text-sm tracking-tight text-zinc-950 line-clamp-1 group-hover:text-zinc-700 transition-colors">
            {room.name}
          </h3>

          <p className="text-xs text-zinc-500 line-clamp-1">
            {currentMedia?.title || room.description || "Active synchronized watch session"}
          </p>
        </div>

        {/* Footer Meta & Actions */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
          {/* Watchers */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span>{room.memberships.length} watchers</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyCode}
              title="Copy invite link"
              className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <Link
              href={`/room/${room.id}`}
              className="inline-flex items-center gap-1 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <span>Join</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
