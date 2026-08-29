"use client";

import * as React from "react";
import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api-client";
import { Room } from "@/lib/contract-types";
import { Users, Play, Copy, Check, Lock, Globe, Share2, ArrowUpRight, Trash2, Loader2 } from "lucide-react";

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps): React.JSX.Element {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [copied, setCopied] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const currentMedia = room.media[0] || null;

  const isOwner =
    Boolean(user?.id) &&
    (room.ownerId === user?.id ||
      (room.owner as any)?.clerkUserId === user?.id ||
      (room.owner as any)?.id === user?.id ||
      (room.owner as any)?.email === user?.primaryEmailAddress?.emailAddress);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/room/${room.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteRoom = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${room.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const token = await getToken();
      await apiClient.delete(`/rooms/${room.id}`, token);
      window.dispatchEvent(new Event("rooms_updated"));
    } catch (err: any) {
      alert(err?.message || "Failed to delete room");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden select-none">
      {/* Video Thumbnail Viewport */}
      <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
        {currentMedia?.thumbnailUrl ? (
          <img
            src={currentMedia.thumbnailUrl}
            alt={room.name ? `${room.name} thumbnail` : "Watch room video thumbnail"}
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
            ) : room.visibility === "UNLISTED" ? (
              <>
                <Share2 className="w-2.5 h-2.5 text-sky-400" /> Unlisted
              </>
            ) : (
              <>
                <Lock className="w-2.5 h-2.5 text-amber-400" /> Invite Only
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
          <h3 className="font-bold text-sm tracking-tight text-zinc-950 dark:text-white line-clamp-1 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
            {room.name}
          </h3>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
            {currentMedia?.title || room.description || "Active synchronized watch session"}
          </p>
        </div>

        {/* Footer Meta & Actions */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
          {/* Watchers */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span>{room.memberships.length} watchers</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isOwner && (
              <button
                onClick={handleDeleteRoom}
                disabled={isDeleting}
                title="Delete Room"
                className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            <button
              onClick={handleCopyCode}
              title="Copy invite link"
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <Link
              href={`/room/${room.id}`}
              className="inline-flex items-center gap-1 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
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
