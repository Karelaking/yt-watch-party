"use client";

import * as React from "react";
import type { Playlist, RoomSettings } from "@/lib/contract-types";
import { Plus, Play, Trash2, ChevronUp, ChevronDown } from "lucide-react";

interface QueueTabProps {
  playlist: Playlist | null;
  settings: RoomSettings;
  isHostOrMod: boolean;
  canControl: boolean;
  onAddPlaylistItem: (mediaUrl: string) => void;
  onRemovePlaylistItem: (itemId: string) => void;
  onReorderPlaylistItem: (itemId: string, direction: "UP" | "DOWN") => void;
  onPlayQueueItem: (mediaId: string) => void;
}

export function QueueTab({
  playlist,
  settings,
  isHostOrMod,
  canControl,
  onAddPlaylistItem,
  onRemovePlaylistItem,
  onReorderPlaylistItem,
  onPlayQueueItem,
}: QueueTabProps): React.JSX.Element {
  const [newQueueUrl, setNewQueueUrl] = React.useState("");

  const handleAddQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQueueUrl.trim()) return;
    onAddPlaylistItem(newQueueUrl.trim());
    setNewQueueUrl("");
  };

  const canManagePlaylist = !settings.onlyHostCanManagePlaylist || isHostOrMod;

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden">
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {/* Add Queue */}
        {canManagePlaylist && (
          <form onSubmit={handleAddQueue} className="flex items-center gap-1.5">
            <input
              type="url"
              placeholder="Paste YouTube, Twitch, Vimeo link..."
              value={newQueueUrl}
              onChange={(e) => setNewQueueUrl(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-zinc-700 font-mono"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </form>
        )}

        {/* List */}
        <div className="space-y-1.5">
          {playlist?.items && playlist.items.length > 0 ? (
            playlist.items.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs"
              >
                <span className="font-mono text-zinc-500 text-[10px] w-4 text-center">
                  #{idx + 1}
                </span>

                <div className="flex-1 truncate">
                  <span className="font-medium text-zinc-200 truncate block text-xs">
                    {item.media.title || "Video"}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    By {item.addedByName || "Guest"}
                  </span>
                </div>

                {/* Reorder Buttons */}
                <div className="flex items-center gap-0.5">
                  {idx > 0 && isHostOrMod && (
                    <button
                      onClick={() => onReorderPlaylistItem(item.id, "UP")}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                  )}
                  {idx < (playlist?.items.length || 0) - 1 && isHostOrMod && (
                    <button
                      onClick={() => onReorderPlaylistItem(item.id, "DOWN")}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {canControl && (
                  <button
                    onClick={() => onPlayQueueItem(item.media.id)}
                    className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
                    title="Play now"
                  >
                    <Play className="w-3 h-3 fill-white ml-0.5" />
                  </button>
                )}

                {isHostOrMod && (
                  <button
                    onClick={() => onRemovePlaylistItem(item.id)}
                    className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-zinc-600 text-xs">
              Queue is empty. Add a video link to start building the playlist!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
