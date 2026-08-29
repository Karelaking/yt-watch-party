"use client";

import * as React from "react";
import type { ChatMessage, RoomSettings } from "@/lib/contract-types";
import { Send, MessageSquareDashed, Loader2 } from "lucide-react";
import {
  ChatMessageList,
  ChatScrollToBottom,
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleHeader,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
  Input,
  Button,
} from "@/components/ui";

interface ChatTabProps {
  messages: ChatMessage[];
  currentUserId: string;
  settings: RoomSettings;
  isHostOrMod: boolean;
  onSendMessage: (text: string) => void | Promise<void>;
}

export function ChatTab({
  messages,
  currentUserId,
  settings,
  isHostOrMod,
  onSendMessage,
}: ChatTabProps): React.JSX.Element {
  const [messageText, setMessageText] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [slowModeCountdown, setSlowModeCountdown] = React.useState(0);
  const [showScrollBottom, setShowScrollBottom] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const scrollViewportRef = React.useRef<HTMLDivElement>(null);
  const isAtBottomRef = React.useRef(true);
  const prevMessagesCountRef = React.useRef(messages.length);

  // Check scroll position to determine if at bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceFromBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;
    const isNearBottom = distanceFromBottom < 60;

    isAtBottomRef.current = isNearBottom;
    setShowScrollBottom(!isNearBottom);

    if (isNearBottom) {
      setUnreadCount(0);
    }
  };

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({
        top: scrollViewportRef.current.scrollHeight,
        behavior,
      });
      isAtBottomRef.current = true;
      setShowScrollBottom(false);
      setUnreadCount(0);
    }
  }, []);

  // Auto-scroll on new messages if already near bottom or increment unread counter
  React.useEffect(() => {
    const isNewMessage = messages.length > prevMessagesCountRef.current;
    prevMessagesCountRef.current = messages.length;

    if (!isNewMessage) return;

    if (isAtBottomRef.current) {
      scrollToBottom("smooth");
    } else {
      setUnreadCount((prev) => prev + 1);
    }
  }, [messages, scrollToBottom]);

  // Initial scroll to bottom on mount
  React.useEffect(() => {
    scrollToBottom("auto");
  }, [scrollToBottom]);

  // Slow mode timer
  React.useEffect(() => {
    if (slowModeCountdown <= 0) return;
    const timer = setTimeout(
      () => setSlowModeCountdown((prev) => prev - 1),
      1000
    );
    return () => clearTimeout(timer);
  }, [slowModeCountdown]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || isPending) return;
    if (slowModeCountdown > 0 && !isHostOrMod) return;

    setIsPending(true);
    try {
      await Promise.resolve(onSendMessage(trimmed));
      setMessageText("");

      // Automatically scroll down when the user sends a message
      setTimeout(() => scrollToBottom("smooth"), 50);

      if (settings.slowModeSeconds > 0 && !isHostOrMod) {
        setSlowModeCountdown(settings.slowModeSeconds);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col justify-between overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/60">
      {/* Scrollable Message List */}
      <ChatMessageList
        ref={scrollViewportRef}
        onScroll={handleScroll}
        className="flex-1 p-3 overflow-y-auto space-y-3 [scrollbar-width:thin]"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2 text-zinc-400 dark:text-zinc-500">
            <MessageSquareDashed className="w-8 h-8 text-zinc-300 dark:text-zinc-600/80 stroke-[1.5]" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">No messages yet</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-600 max-w-[200px]">
              Say hello or react with emojis to get the watch party started!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf =
              msg.userId === currentUserId ||
              (msg as any)?.user?.clerkUserId === currentUserId;

            return (
              <ChatBubble
                key={msg.id}
                variant={isSelf ? "sent" : "received"}
              >
                {!isSelf && (
                  <ChatBubbleAvatar
                    src={msg.userAvatar}
                    fallback={msg.userName || "U"}
                  />
                )}

                <div className="flex flex-col max-w-full">
                  <ChatBubbleHeader
                    senderName={msg.userName}
                    role={msg.userRole}
                    isSelf={isSelf}
                  />

                  <div className="flex flex-col">
                    <ChatBubbleMessage
                      variant={isSelf ? "sent" : "received"}
                    >
                      {msg.content}
                    </ChatBubbleMessage>

                    {msg.createdAt && (
                      <ChatBubbleTimestamp
                        timestamp={msg.createdAt}
                        className={isSelf ? "text-right" : "text-left"}
                      />
                    )}
                  </div>
                </div>
              </ChatBubble>
            );
          })
        )}
      </ChatMessageList>

      {/* Floating Scroll to Bottom pill if user scrolled up */}
      {showScrollBottom && (
        <ChatScrollToBottom
          unreadCount={unreadCount}
          onClick={() => scrollToBottom("smooth")}
        />
      )}

      {/* Chat Input Bar */}
      {settings.allowChat ? (
        <form
          onSubmit={handleSend}
          aria-busy={isPending}
          className="p-2.5 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center gap-2"
        >
          <Input
            id="room-chat-message-input"
            aria-label="Chat message"
            type="text"
            required
            value={messageText}
            disabled={isPending || (slowModeCountdown > 0 && !isHostOrMod)}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={
              slowModeCountdown > 0 && !isHostOrMod
                ? `Slow mode active (${slowModeCountdown}s)...`
                : "Type a message..."
            }
            maxLength={500}
            className="flex-1 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-xl px-3 py-2 h-9 focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-600 disabled:opacity-60"
          />
          <Button
            type="submit"
            size="sm"
            aria-label="Send chat message"
            disabled={
              isPending ||
              !messageText.trim() ||
              (slowModeCountdown > 0 && !isHostOrMod)
            }
            aria-disabled={
              isPending ||
              !messageText.trim() ||
              (slowModeCountdown > 0 && !isHostOrMod)
            }
            className="h-9 w-9 p-0 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      ) : (
        <div
          role="status"
          aria-live="polite"
          className="p-3 bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800/80 text-center text-xs text-zinc-500 font-medium select-none"
        >
          Chat has been disabled by host.
        </div>
      )}
    </div>
  );
}

