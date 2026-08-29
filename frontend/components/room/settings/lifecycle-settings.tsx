"use client";

import * as React from "react";
import type { RoomSettings } from "@/lib/contract-types";
import { AlertTriangle, Archive, Power } from "lucide-react";

interface LifecycleSettingsProps {
  settings: RoomSettings;
  onUpdate: (key: keyof RoomSettings, val: boolean | number) => void;
  onEndRoom: () => void;
  onArchiveRoom: () => void;
}

export function LifecycleSettings({
  settings,
  onUpdate,
  onEndRoom,
  onArchiveRoom,
}: LifecycleSettingsProps): React.JSX.Element {
  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <label htmlFor="setting-disconnect-host" className="cursor-pointer">
          <div className="font-semibold text-zinc-900 dark:text-zinc-200">
            Disconnect on Host Leave
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Automatically pause playback if the host disconnects
          </div>
        </label>
        <input
          id="setting-disconnect-host"
          type="checkbox"
          checked={settings.disconnectOnHostLeave}
          onChange={(e) =>
            onUpdate("disconnectOnHostLeave", e.target.checked)
          }
          className="h-6 w-6 min-h-[24px] min-w-[24px] accent-zinc-950 dark:accent-white cursor-pointer"
        />
      </div>

      <div className="p-3 rounded-xl border border-red-200 dark:border-red-950/60 bg-red-50/70 dark:bg-red-950/20 space-y-3">
        <div className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-200">End Room Session</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Closes the stream and kicks all viewers
            </div>
          </div>
          <button
            type="button"
            onClick={onEndRoom}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Power className="w-3.5 h-3.5" /> End Room
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-red-200 dark:border-red-900/40">
          <div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-200">Archive Room</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Save history and lock from further activity
            </div>
          </div>
          <button
            type="button"
            onClick={onArchiveRoom}
            className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Archive className="w-3.5 h-3.5" /> Archive
          </button>
        </div>
      </div>
    </div>
  );
}
