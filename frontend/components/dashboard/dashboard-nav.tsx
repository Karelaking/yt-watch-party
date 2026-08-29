"use client";

import * as React from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Play, Plus, Search } from "lucide-react";

interface DashboardNavProps {
  onCreateClick: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCommandMenu?: () => void;
}

export function DashboardNav({
  onCreateClick,
  searchQuery,
  onSearchChange,
  onOpenCommandMenu,
}: DashboardNavProps): React.JSX.Element {
  return (
    <header
      role="banner"
      aria-label="Dashboard Navigation"
      className="sticky top-0 z-40 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand & Breadcrumb */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="h-7 w-7 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold text-xs">
              <Play className="h-3 w-3 fill-current ml-0.5" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-950 dark:text-white">
              WatchParty
            </span>
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700 text-sm hidden sm:inline">/</span>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hidden sm:inline">
            Dashboard
          </span>
        </div>

        {/* Minimal Search Input */}
        <div className="flex-1 max-w-sm mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <label htmlFor="dashboard-search-input" className="sr-only">
              Search rooms or enter room code
            </label>
            <input
              id="dashboard-search-input"
              type="search"
              placeholder="Search rooms or code..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 focus:bg-white dark:focus:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-8 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-950 dark:focus:border-zinc-100 focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 transition-all"
            />
            <button
              type="button"
              onClick={onOpenCommandMenu}
              aria-label="Open command menu shortcut"
              className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.5 rounded cursor-pointer hover:bg-zinc-300/80 dark:hover:bg-zinc-700"
            >
              <span>⌘</span>
              <span>K</span>
            </button>
          </div>
        </div>

        {/* Actions & User */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Room</span>
          </button>

          <div className="h-4 w-px bg-zinc-200 hidden sm:block" />

          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-7 w-7 border border-zinc-200",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
