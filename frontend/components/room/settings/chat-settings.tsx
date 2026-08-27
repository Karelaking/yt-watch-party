"use client";

import * as React from "react";
import type { RoomSettings } from "@/lib/contract-types";

interface ChatSettingsProps {
  settings: RoomSettings;
  onUpdate: (key: keyof RoomSettings, val: boolean | number) => void;
}

export function ChatSettings({
  settings,
  onUpdate,
}: ChatSettingsProps): React.JSX.Element {
  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
        <div>
          <div className="font-semibold text-zinc-200">Enable Live Chat</div>
          <div className="text-[11px] text-zinc-400">
            Allow viewers to send messages in the room
          </div>
        </div>
        <input
          type="checkbox"
          checked={settings.allowChat}
          onChange={(e) => onUpdate("allowChat", e.target.checked)}
          className="h-4 w-4 accent-white cursor-pointer"
        />
      </div>

      <div className="space-y-1.5 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-zinc-200">Slow Mode Delay</div>
          <span className="font-mono text-zinc-400 text-xs">
            {settings.slowModeSeconds === 0
              ? "Off"
              : `${settings.slowModeSeconds}s`}
          </span>
        </div>
        <div className="text-[11px] text-zinc-400">
          Cooldown between messages for non-moderators
        </div>
        <input
          type="range"
          min={0}
          max={60}
          step={5}
          value={settings.slowModeSeconds}
          onChange={(e) =>
            onUpdate("slowModeSeconds", Number(e.target.value))
          }
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white mt-1"
        />
      </div>

      <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
        <div>
          <div className="font-semibold text-zinc-200">Screen Sharing</div>
          <div className="text-[11px] text-zinc-400">
            Allow members to broadcast their screen stream
          </div>
        </div>
        <input
          type="checkbox"
          checked={settings.allowScreenShare}
          onChange={(e) => onUpdate("allowScreenShare", e.target.checked)}
          className="h-4 w-4 accent-white cursor-pointer"
        />
      </div>
    </div>
  );
}
