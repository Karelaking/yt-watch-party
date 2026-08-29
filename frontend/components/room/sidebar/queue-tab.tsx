"use client";

import * as React from "react";
import type { Playlist, RoomSettings } from "@/lib/contract-types";
import { Plus, Play, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

interface QueueTabProps {
  playlist: Playlist | null;
  settings: RoomSettings;
  isHostOrMod: boolean;
  canControl: boolean;
  onAddPlaylistItem: (mediaUrl: string) => void | Promise<void>;
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
  const [isPending, setIsPending] = React.useState(false);

  const handleAddQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQueueUrl.trim() || isPending) return;
    setIsPending(true);
    try {
      await Promise.resolve(onAddPlaylistItem(newQueueUrl.trim()));
      setNewQueueUrl("");
    } finally {
      setIsPending(false);
    }
  };

  const canManagePlaylist = !settings.onlyHostCanManagePlaylist || isHostOrMod;

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden">
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {/* Add Queue */}
        {canManagePlaylist && (
          <form onSubmit={handleAddQueue} aria-busy={isPending} className="flex items-center gap-1.5">
            <label htmlFor="add-queue-video-input" className="sr-only">
              YouTube video URL or ID
            </label>
            <input
              id="add-queue-video-input"
              aria-label="YouTube video URL or ID to add to queue"
              type="text"
              required
              minLength={3}
              disabled={isPending}
              placeholder="Paste YouTube link or Video ID..."
              value={newQueueUrl}
              onChange={(e) => setNewQueueUrl(e.target.value)}
              className="flex-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-zinc-400 dark:focus:border-zinc-700 focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-600 font-mono text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Add video to queue"
              disabled={isPending || !newQueueUrl.trim()}
              aria-disabled={isPending || !newQueueUrl.trim()}
              className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-colors"
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
              <span role="status" aria-live="polite">{isPending ? "Adding..." : "Add"}</span>
            </button>
          </form>
        )}

        {/* List */}
        <div className="space-y-1.5">
          {playlist?.items && playlist.items.length > 0 ? (
            playlist.items.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 text-xs"
              >
                <span className="font-mono text-zinc-400 dark:text-zinc-500 text-[10px] w-4 text-center">
                  #{idx + 1}
                </span>

                <div className="flex-1 truncate">
                  <span className="font-medium text-zinc-900 dark:text-zinc-200 truncate block text-xs">
                    {item.media?.title || "Video"}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    By {item.addedByName || "Guest"}
                  </span>
                </div>

                {/* Reorder Buttons */}
                <div className="flex items-center gap-0.5">
                  {idx > 0 && isHostOrMod && (
                    <button
                      type="button"
                      onClick={() => onReorderPlaylistItem(item.id, "UP")}
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                      title="Move Up"
                      aria-label={`Move ${item.media?.title || "video"} up in queue`}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                  )}
                  {idx < (playlist?.items?.length || 0) - 1 && isHostOrMod && (
                    <button
                      type="button"
                      onClick={() => onReorderPlaylistItem(item.id, "DOWN")}
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                      title="Move Down"
                      aria-label={`Move ${item.media?.title || "video"} down in queue`}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {canControl && (
                  <button
                    type="button"
                    onClick={() => onPlayQueueItem(item.media?.id || item.mediaId)}
                    className="p-1 rounded bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white cursor-pointer"
                    title="Play now"
                    aria-label={`Play ${item.media?.title || "video"} now`}
                  >
                    <Play className="w-3 h-3 fill-white ml-0.5" />
                  </button>
                )}

                {isHostOrMod && (
                  <button
                    type="button"
                    onClick={() => onRemovePlaylistItem(item.id)}
                    className="p-1 rounded text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                    title="Remove from queue"
                    aria-label={`Remove ${item.media?.title || "video"} from queue`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-zinc-400 dark:text-zinc-600 text-xs">
              Queue is empty. Add a video link to start building the playlist!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
