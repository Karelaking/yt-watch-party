"use client";

import * as React from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Play, Plus, Search } from "lucide-react";

interface DashboardNavProps {
  onCreateClick: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function DashboardNav({
  onCreateClick,
  searchQuery,
  onSearchChange,
}: DashboardNavProps): React.JSX.Element {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-zinc-200 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand & Breadcrumb */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="h-7 w-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold text-xs">
              <Play className="h-3 w-3 fill-white ml-0.5" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-950">
              WatchParty
            </span>
          </Link>
          <span className="text-zinc-300 text-sm hidden sm:inline">/</span>
          <span className="text-xs font-semibold text-zinc-500 hidden sm:inline">
            Dashboard
          </span>
        </div>

        {/* Minimal Search Input */}
        <div className="flex-1 max-w-sm mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search rooms or code..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-zinc-50 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200 rounded-lg pl-8 pr-8 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-200/60 px-1.5 py-0.5 rounded">
              <span>⌘</span>
              <span>K</span>
            </div>
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
