import * as React from "react";

export default function GlobalLoading(): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-zinc-300 border-t-zinc-950 animate-spin" />
        <span className="text-xs font-semibold text-zinc-500 tracking-wide">
          Loading WatchParty...
        </span>
      </div>
    </div>
  );
}
