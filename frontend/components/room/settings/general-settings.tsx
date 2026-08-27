"use client";

import * as React from "react";
import type { RoomVisibility } from "@/lib/contract-types";
import { Globe, Lock, Share2 } from "lucide-react";

interface GeneralSettingsProps {
  name: string;
  description: string;
  visibility: RoomVisibility;
  maxMembers: number;
  onNameChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  onVisibilityChange: (val: RoomVisibility) => void;
  onMaxMembersChange: (val: number) => void;
}

export function GeneralSettings({
  name,
  description,
  visibility,
  maxMembers,
  onNameChange,
  onDescriptionChange,
  onVisibilityChange,
  onMaxMembersChange,
}: GeneralSettingsProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-300">Room Title</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-zinc-700 outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-300">
          Description (Optional)
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="What is this party about?"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-zinc-700 outline-none resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-300">Visibility</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onVisibilityChange("PUBLIC")}
            className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 cursor-pointer transition-all ${
              visibility === "PUBLIC"
                ? "border-white bg-zinc-800 text-white"
                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Public</span>
            </div>
            <span className="text-[10px] text-zinc-400">Discoverable</span>
          </button>

          <button
            type="button"
            onClick={() => onVisibilityChange("UNLISTED")}
            className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 cursor-pointer transition-all ${
              visibility === "UNLISTED"
                ? "border-white bg-zinc-800 text-white"
                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Unlisted</span>
            </div>
            <span className="text-[10px] text-zinc-400">Invite link only</span>
          </button>

          <button
            type="button"
            onClick={() => onVisibilityChange("PRIVATE")}
            className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 cursor-pointer transition-all ${
              visibility === "PRIVATE"
                ? "border-white bg-zinc-800 text-white"
                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Private</span>
            </div>
            <span className="text-[10px] text-zinc-400">Approval needed</span>
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-300">
          Max Capacity ({maxMembers} Viewers)
        </label>
        <input
          type="range"
          min={5}
          max={100}
          step={5}
          value={maxMembers}
          onChange={(e) => onMaxMembersChange(Number(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
        />
      </div>
    </div>
  );
}
