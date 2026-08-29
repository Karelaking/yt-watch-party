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
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <label htmlFor="setting-enable-chat" className="cursor-pointer">
          <div className="font-semibold text-zinc-900 dark:text-zinc-200">Enable Live Chat</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Allow viewers to send messages in the room
          </div>
        </label>
        <input
          id="setting-enable-chat"
          type="checkbox"
          checked={settings.allowChat}
          onChange={(e) => onUpdate("allowChat", e.target.checked)}
          className="h-6 w-6 min-h-[24px] min-w-[24px] accent-zinc-950 dark:accent-white cursor-pointer"
        />
      </div>

      <div className="space-y-1.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <label htmlFor="setting-slow-mode" className="font-semibold text-zinc-900 dark:text-zinc-200 cursor-pointer">
            Slow Mode Delay
          </label>
          <span className="font-mono text-zinc-500 dark:text-zinc-400 text-xs">
            {settings.slowModeSeconds === 0
              ? "Off"
              : `${settings.slowModeSeconds}s`}
          </span>
        </div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Cooldown between messages for non-moderators
        </div>
        <input
          id="setting-slow-mode"
          type="range"
          min={0}
          max={60}
          step={5}
          value={settings.slowModeSeconds}
          onChange={(e) =>
            onUpdate("slowModeSeconds", Number(e.target.value))
          }
          className="w-full h-2 min-h-[24px] bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-950 dark:accent-white mt-1"
        />
      </div>

      <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <label htmlFor="setting-screen-share" className="cursor-pointer">
          <div className="font-semibold text-zinc-900 dark:text-zinc-200">Screen Sharing</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Allow members to broadcast their screen stream
          </div>
        </label>
        <input
          id="setting-screen-share"
          type="checkbox"
          checked={settings.allowScreenShare}
          onChange={(e) => onUpdate("allowScreenShare", e.target.checked)}
          className="h-6 w-6 min-h-[24px] min-w-[24px] accent-zinc-950 dark:accent-white cursor-pointer"
        />
      </div>
    </div>
  );
}
