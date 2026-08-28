"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  viewportRef?: React.RefObject<HTMLDivElement | null>;
  onScrollChange?: (e: React.UIEvent<HTMLDivElement>) => void;
  autoScrollToBottom?: boolean;
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, viewportRef, onScrollChange, ...props }, ref): React.JSX.Element => {
    const internalViewportRef = React.useRef<HTMLDivElement>(null);
    const resolvedViewportRef = viewportRef || internalViewportRef;

    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        <div
          ref={resolvedViewportRef as React.RefObject<HTMLDivElement>}
          onScroll={onScrollChange}
          className="h-full w-full overflow-y-auto overflow-x-hidden scroll-smooth overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700/60 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-500/80 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {children}
        </div>
      </div>
    );
  }
);
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };

