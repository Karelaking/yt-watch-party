"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

export interface ChatBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleVariant> {
  layout?: "default" | "ai";
}

const chatBubbleVariant = cva("flex gap-2 max-w-[88%] leading-relaxed", {
  variants: {
    variant: {
      sent: "flex-row-reverse self-end",
      received: "flex-row self-start",
    },
  },
  defaultVariants: {
    variant: "received",
  },
});

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ className, variant, layout = "default", children, ...props }, ref): React.JSX.Element => (
    <div
      ref={ref}
      className={cn(
        "group relative flex w-full",
        variant === "sent" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(chatBubbleVariant({ variant }), className)}
        {...props}
      >
        {children}
      </div>
    </div>
  )
);
ChatBubble.displayName = "ChatBubble";

export interface ChatBubbleAvatarProps {
  src?: string | null;
  fallback?: string;
  className?: string;
}

function ChatBubbleAvatar({
  src,
  fallback = "U",
  className,
}: ChatBubbleAvatarProps): React.JSX.Element {
  return (
    <Avatar size="sm" className={cn("mt-0.5 shrink-0 border border-zinc-800", className)}>
      {src && <AvatarImage src={src} />}
      <AvatarFallback className="bg-zinc-800 text-[10px] text-zinc-300 font-bold">
        {fallback.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

export interface ChatBubbleHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "role"> {
  senderName: string;
  role?: string | null;
  isSelf?: boolean;
}

function ChatBubbleHeader({
  senderName,
  role,
  isSelf = false,
  className,
  children,
  ...props
}: ChatBubbleHeaderProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 mb-1 text-[11px]",
        isSelf ? "justify-end" : "justify-start",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "font-semibold truncate max-w-[140px]",
          isSelf ? "text-zinc-400" : "text-zinc-200"
        )}
      >
        {isSelf ? `${senderName || "You"} (You)` : senderName || "Member"}
      </span>
      {role === "HOST" && (
        <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/70 border border-amber-800/70 px-1.5 py-0.2 rounded">
          Host
        </span>
      )}
      {role === "MODERATOR" && (
        <span className="text-[9px] font-black uppercase tracking-wider text-sky-400 bg-sky-950/70 border border-sky-800/70 px-1.5 py-0.2 rounded">
          Mod
        </span>
      )}
      {children}
    </div>
  );
}

const chatBubbleMessageVariants = cva(
  "rounded-2xl px-3.5 py-2 text-xs break-words transition-colors shadow-sm",
  {
    variants: {
      variant: {
        sent: "bg-white text-zinc-950 font-medium rounded-tr-xs selection:bg-zinc-300",
        received:
          "bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-tl-xs selection:bg-zinc-700",
      },
    },
    defaultVariants: {
      variant: "received",
    },
  }
);

export interface ChatBubbleMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleMessageVariants> {
  isLoading?: boolean;
}

const ChatBubbleMessage = React.forwardRef<
  HTMLDivElement,
  ChatBubbleMessageProps
>(({ className, variant, isLoading, children, ...props }, ref): React.JSX.Element => (
  <div
    ref={ref}
    className={cn(chatBubbleMessageVariants({ variant }), className)}
    {...props}
  >
    {isLoading ? (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading message"
        className="flex items-center gap-1.5 py-1"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
        <span className="sr-only">Loading message...</span>
      </div>
    ) : (
      children
    )}
  </div>
));
ChatBubbleMessage.displayName = "ChatBubbleMessage";

export interface ChatBubbleTimestampProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  timestamp: string | Date;
}

function ChatBubbleTimestamp({
  timestamp,
  className,
  ...props
}: ChatBubbleTimestampProps): React.JSX.Element {
  const formatted = React.useMemo(() => {
    try {
      const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }, [timestamp]);

  return (
    <span
      className={cn("text-[9px] text-zinc-500 mt-1 select-none", className)}
      {...props}
    >
      {formatted}
    </span>
  );
}

export {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleHeader,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
};

