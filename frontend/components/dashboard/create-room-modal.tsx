"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube-utils";
import { RoomVisibility } from "@/lib/contract-types";
import { useAuth, useUser } from "@clerk/nextjs";
import { apiClient } from "@/lib/api-client";
import { YouTubeIcon } from "@/components/ds/brand-icons";
import { X, Globe, Share2, Lock, ChevronDown, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function CreateRoomModal({
  isOpen,
  onClose,
}: CreateRoomModalProps): React.JSX.Element | null {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [name, setName] = React.useState("Friday Movie & Chill");
  const [youtubeUrl, setYoutubeUrl] = React.useState("https://www.youtube.com/watch?v=jfKfPfyJRdk");
  const [visibility, setVisibility] = React.useState<RoomVisibility>("PUBLIC");
  const [showSettings, setShowSettings] = React.useState(false);
  const [onlyHostControl, setOnlyHostControl] = React.useState(false);
  const [allowChat, setAllowChat] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const videoId = extractYouTubeId(youtubeUrl);
  const thumbnail = videoId ? getYouTubeThumbnail(videoId) : null;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (!user) {
        setErrorMsg("Please sign in to create and host a watch room.");
        setIsSubmitting(false);
        return;
      }

      const token = await getToken();
      if (!token) {
        setErrorMsg("Authentication session expired. Please sign in again.");
        setIsSubmitting(false);
        return;
      }


      const createPayload = {
        name: name.trim(),
        visibility,
        discoverable: visibility === "PUBLIC",
        settings: {
          onlyHostCanControlPlayback: onlyHostControl,
          allowChat,
        },
      };

      const res = await apiClient.post<ApiResponse<{ room: { id: string; code: string } }>>(
        "/rooms",
        createPayload,
        token
      );

      const newRoomId = res?.data?.room?.id;
      if (!newRoomId) {
        throw new Error("Failed to obtain created room identifier from server");
      }

      // Add initial media stream to the newly created room
      try {
        await apiClient.post(
          `/media/rooms/${newRoomId}`,
          {
            url: youtubeUrl.trim(),
            title: name.trim(),
          },
          token
        );
      } catch (mediaErr) {
        console.warn("Media attach notice:", mediaErr);
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rooms_updated"));
      }

      onClose();
      router.push(`/room/${newRoomId}`);
    } catch (err: any) {
      console.error("Failed to create room on backend:", err);
      setErrorMsg(err?.message || "Failed to create room. Please ensure you are logged in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-zinc-200 w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div>
            <h2 className="font-bold text-sm text-zinc-950">Create Watch Room</h2>
            <p className="text-xs text-zinc-500">
              Start a synchronized streaming session
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Room Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-800">
              Room Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lofi Chill Lounge"
              className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-zinc-900 focus:border-zinc-950 outline-none transition-all"
            />
          </div>

          {/* YouTube Video URL */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
              <YouTubeIcon className="w-3.5 h-3.5 fill-red-500 text-red-500" />
              <span>YouTube Video URL</span>
            </label>
            <input
              type="url"
              required
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-zinc-900 focus:border-zinc-950 outline-none transition-all font-mono"
            />

            {/* Video preview strip */}
            {thumbnail && (
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-50 border border-zinc-200 mt-2">
                <img
                  src={thumbnail}
                  alt="preview"
                  className="w-12 h-8 rounded object-cover border border-zinc-200"
                />
                <div className="flex-1 min-w-0 text-xs">
                  <span className="font-semibold text-zinc-800 truncate block">
                    YouTube ID: {videoId}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    Ready to stream in sync
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Visibility Options */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-800">
              Visibility
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVisibility("PUBLIC")}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  visibility === "PUBLIC"
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                <Globe className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-xs font-bold leading-tight">Public</div>
                  <div className={`text-[10px] ${visibility === "PUBLIC" ? "text-zinc-300" : "text-zinc-500"}`}>
                    Discoverable
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility("UNLISTED")}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  visibility === "UNLISTED"
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-xs font-bold leading-tight">Unlisted</div>
                  <div className={`text-[10px] ${visibility === "UNLISTED" ? "text-zinc-300" : "text-zinc-500"}`}>
                    Link only
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility("PRIVATE")}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  visibility === "PRIVATE"
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                <Lock className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-xs font-bold leading-tight">Invite Only</div>
                  <div className={`text-[10px] ${visibility === "PRIVATE" ? "text-zinc-300" : "text-zinc-500"}`}>
                    Private
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Optional Controls Toggle */}
          <div className="pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-between w-full text-xs font-semibold text-zinc-600 hover:text-zinc-950 py-1 cursor-pointer"
            >
              <span>Room Permissions</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  showSettings ? "rotate-180" : ""
                }`}
              />
            </button>

            {showSettings && (
              <div className="mt-2 space-y-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-zinc-800 font-medium">Host-Only Playback Control</span>
                  <input
                    type="checkbox"
                    checked={onlyHostControl}
                    onChange={(e) => setOnlyHostControl(e.target.checked)}
                    className="accent-zinc-950"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-zinc-800 font-medium">Enable Room Chat</span>
                  <input
                    type="checkbox"
                    checked={allowChat}
                    onChange={(e) => setAllowChat(e.target.checked)}
                    className="accent-zinc-950"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!videoId || isSubmitting}
              className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? "Creating..." : "Start Room"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
