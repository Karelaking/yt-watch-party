import * as React from "react";

export default function RoomLoading(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white flex flex-col font-sans">
      {/* Top Header Skeleton */}
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/60 px-4 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-20 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-7 w-20 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start animate-pulse">
        {/* Cinema Player Skeleton (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="aspect-video w-full rounded-2xl bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800/80 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full border-2 border-zinc-400 dark:border-zinc-700 border-t-zinc-950 dark:border-t-white animate-spin" />
          </div>
          <div className="h-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80" />
        </div>

        {/* Sidebar Skeleton (4 cols) */}
        <div className="lg:col-span-4 h-140 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-3 space-y-3">
          <div className="h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-96 rounded-lg bg-zinc-100 dark:bg-zinc-950/40" />
          <div className="h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </main>
    </div>
  );
}
