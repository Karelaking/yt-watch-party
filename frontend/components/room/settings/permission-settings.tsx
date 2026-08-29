"use client";

import * as React from "react";
import type { RoomSettings } from "@/lib/contract-types";

interface PermissionSettingsProps {
  settings: RoomSettings;
  onUpdate: (key: keyof RoomSettings, val: boolean | number) => void;
}

export function PermissionSettings({
  settings,
  onUpdate,
}: PermissionSettingsProps): React.JSX.Element {
  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <label htmlFor="perm-host-only" className="cursor-pointer">
          <div className="font-semibold text-zinc-900 dark:text-zinc-200">Host-Only Playback</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Only the room host can pause, play, or seek
          </div>
        </label>
        <input
          id="perm-host-only"
          type="checkbox"
          checked={settings.onlyHostCanControlPlayback}
          onChange={(e) =>
            onUpdate("onlyHostCanControlPlayback", e.target.checked)
          }
          className="h-6 w-6 min-h-[24px] min-w-[24px] accent-zinc-950 dark:accent-white cursor-pointer"
        />
      </div>

      <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <label htmlFor="perm-mod-control" className="cursor-pointer">
          <div className="font-semibold text-zinc-900 dark:text-zinc-200">Moderator Playback Control</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Allow appointed moderators to control playback
          </div>
        </label>
        <input
          id="perm-mod-control"
          type="checkbox"
          checked={settings.allowModeratorPlaybackControl}
          onChange={(e) =>
            onUpdate("allowModeratorPlaybackControl", e.target.checked)
          }
          className="h-6 w-6 min-h-[24px] min-w-[24px] accent-zinc-950 dark:accent-white cursor-pointer"
        />
      </div>

      <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <label htmlFor="perm-queue-mgmt" className="cursor-pointer">
          <div className="font-semibold text-zinc-900 dark:text-zinc-200">Queue Management</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Only host can add or remove items from the queue
          </div>
        </label>
        <input
          id="perm-queue-mgmt"
          type="checkbox"
          checked={settings.onlyHostCanManagePlaylist}
          onChange={(e) =>
            onUpdate("onlyHostCanManagePlaylist", e.target.checked)
          }
          className="h-6 w-6 min-h-[24px] min-w-[24px] accent-zinc-950 dark:accent-white cursor-pointer"
        />
      </div>

      <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <label htmlFor="perm-guest-join" className="cursor-pointer">
          <div className="font-semibold text-zinc-900 dark:text-zinc-200">Allow Guest Joining</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Allow viewers without an account to join and watch
          </div>
        </label>
        <input
          id="perm-guest-join"
          type="checkbox"
          checked={settings.allowGuestJoin}
          onChange={(e) => onUpdate("allowGuestJoin", e.target.checked)}
          className="h-6 w-6 min-h-[24px] min-w-[24px] accent-zinc-950 dark:accent-white cursor-pointer"
        />
      </div>
    </div>
  );
}
