"use client";

import * as React from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ChatMessageListProps
  extends React.HTMLAttributes<HTMLDivElement> {
  smoothScroll?: boolean;
}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ className, children, smoothScroll = true, ...props }, ref): React.JSX.Element => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-3 p-3 overflow-y-auto overflow-x-hidden select-text",
          smoothScroll && "scroll-smooth",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ChatMessageList.displayName = "ChatMessageList";

export interface ChatScrollToBottomProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  unreadCount?: number;
}

const ChatScrollToBottom = React.forwardRef<
  HTMLButtonElement,
  ChatScrollToBottomProps
>(({ className, unreadCount, onClick, ...props }, ref): React.JSX.Element => {
  return (
    <Button
      ref={ref}
      variant="secondary"
      size="sm"
      onClick={onClick}
      className={cn(
        "absolute bottom-4 left-1/2 -translate-x-1/2 shadow-xl bg-zinc-900/95 border border-zinc-700/80 text-zinc-200 hover:text-white hover:bg-zinc-800 rounded-full text-[11px] h-7 px-3 flex items-center gap-1.5 backdrop-blur-md transition-all animate-bounce select-none cursor-pointer z-20",
        className
      )}
      {...props}
    >
      <ArrowDown className="w-3 h-3" />
      <span>{unreadCount && unreadCount > 0 ? `${unreadCount} new messages` : "Scroll to bottom"}</span>
    </Button>
  );
});
ChatScrollToBottom.displayName = "ChatScrollToBottom";

export { ChatMessageList, ChatScrollToBottom };

