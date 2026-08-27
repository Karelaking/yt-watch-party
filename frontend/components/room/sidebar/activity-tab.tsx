"use client";

import * as React from "react";
import type { RoomEvent } from "@/lib/contract-types";

interface ActivityTabProps {
  events: RoomEvent[];
}

export function ActivityTab({ events }: ActivityTabProps): React.JSX.Element {
  return (
    <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
      <span className="text-zinc-500 uppercase font-semibold text-[10px] tracking-wider block">
        Live Room Events ({events.length})
      </span>

      <div className="space-y-2">
        {events && events.length > 0 ? (
          events.map((ev) => (
            <div
              key={ev.id}
              className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] space-y-0.5"
            >
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-semibold text-zinc-300 font-mono text-[10px]">
                  {ev.type}
                </span>
                <span className="text-[9px] text-zinc-500">
                  {new Date(ev.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-zinc-400">
                <strong className="text-zinc-200">
                  {ev.actorName || "System"}
                </strong>{" "}
                triggered this event.
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-zinc-600 text-xs">
            No events recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
