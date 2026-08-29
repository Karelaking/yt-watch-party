import * as React from "react";

export default function DashboardLoading(): React.JSX.Element {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 font-sans">
      {/* Top Navbar Skeleton */}
      <div className="h-16 border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 px-6 flex items-center justify-between animate-pulse motion-reduce:animate-none">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="h-8 w-64 rounded-full bg-zinc-100 dark:bg-zinc-800 hidden sm:block" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Main Container Skeleton */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 animate-pulse motion-reduce:animate-none">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-6 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-64 rounded bg-zinc-100 dark:bg-zinc-800/60" />
          </div>
          <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
        </div>

        {/* Stats Strip Skeleton */}
        <div className="h-20 rounded-2xl bg-zinc-200/60 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />

        {/* Rooms Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 space-y-3"
            >
              <div className="h-36 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
