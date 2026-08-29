"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export function Command({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-zinc-950 text-white",
        className
      )}
      {...props}
    />
  );
}

export function CommandDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}): React.JSX.Element | null {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        <Command>{children}</Command>
      </div>
    </div>
  );
}

export function CommandInput({
  className,
  value,
  onValueChange,
  placeholder = "Type a command or search...",
  ...props
}: {
  className?: string;
  value?: string;
  onValueChange?: (search: string) => void;
  placeholder?: string;
} & React.InputHTMLAttributes<HTMLInputElement>): React.JSX.Element {
  return (
    <div className="flex items-center px-3 border-b border-zinc-800">
      <Search className="mr-2 h-4 w-4 shrink-0 text-zinc-400" />
      <input
        aria-label="Command search input"
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-xs outline-none focus-visible:ring-1 focus-visible:ring-zinc-600 placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 text-white",
          className
        )}
        {...props}
      />
    </div>
  );
}

export function CommandList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden p-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CommandEmpty({
  className,
  children = "No results found.",
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn("py-6 text-center text-xs text-zinc-400", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CommandGroup({
  className,
  heading,
  children,
  ...props
}: {
  heading?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div className={cn("overflow-hidden p-1 text-white", className)} {...props}>
      {heading && (
        <div className="px-2 py-1.5 text-[11px] font-semibold text-zinc-400">
          {heading}
        </div>
      )}
      {children}
    </div>
  );
}

export function CommandItem({
  className,
  onSelect,
  children,
  ...props
}: {
  onSelect?: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-zinc-600 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors text-left",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function CommandShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>): React.JSX.Element {
  return (
    <span
      className={cn(
        "ml-auto text-[10px] tracking-widest text-zinc-400",
        className
      )}
      {...props}
    />
  );
}

export function CommandSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn("-mx-1 my-1 h-px bg-zinc-800", className)}
      {...props}
    />
  );
}
