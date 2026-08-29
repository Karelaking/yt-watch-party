"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PillBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  tag?: string;
  subtext?: string;
}

export function PillBadge({
  className,
  icon,
  tag = "AI-Powered",
  subtext = "Sync & Watch Together",
  children,
  ...props
}: PillBadgeProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium shadow-xs backdrop-blur-xs hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-default select-none",
        className
      )}
      {...props}
    >
      {icon && <span className="text-sm">{icon}</span>}
      {tag && (
        <span className="bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide">
          {tag}
        </span>
      )}
      {subtext && <span className="text-zinc-600 dark:text-zinc-400 font-medium">{subtext}</span>}
      {children}
    </div>
  );
}
