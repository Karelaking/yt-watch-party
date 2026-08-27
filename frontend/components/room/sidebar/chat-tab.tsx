"use client";

import * as React from "react";
import type { ChatMessage, RoomSettings } from "@/lib/contract-types";
import { Send } from "lucide-react";

interface ChatTabProps {
  messages: ChatMessage[];
  currentUserId: string;
  settings: RoomSettings;
  isHostOrMod: boolean;
  onSendMessage: (text: string) => void;
}

export function ChatTab({
  messages,
  currentUserId,
  settings,
  isHostOrMod,
  onSendMessage,
}: ChatTabProps): React.JSX.Element {
  const [messageText, setMessageText] = React.useState("");
  const [slowModeCountdown, setSlowModeCountdown] = React.useState(0);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll chat on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Slow mode timer
  React.useEffect(() => {
    if (slowModeCountdown <= 0) return;
    const timer = setTimeout(
      () => setSlowModeCountdown((prev) => prev - 1),
      1000
    );
    return () => clearTimeout(timer);
  }, [slowModeCountdown]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    if (slowModeCountdown > 0 && !isHostOrMod) return;

    onSendMessage(messageText.trim());
    setMessageText("");

    if (settings.slowModeSeconds > 0 && !isHostOrMod) {
      setSlowModeCountdown(settings.slowModeSeconds);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden">
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {messages.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 text-xs">
            No messages yet. Send a message to start the room chat!
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.userId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isSelf ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                  <span className="text-[10px] font-semibold text-zinc-400">
                    {msg.userName}
                  </span>
                  {msg.userRole === "HOST" && (
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1 rounded">
                      HOST
                    </span>
                  )}
                  {msg.userRole === "MODERATOR" && (
                    <span className="text-[9px] font-bold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-1 rounded">
                      MOD
                    </span>
                  )}
                </div>
                <div
                  className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                    isSelf
                      ? "bg-zinc-100 text-zinc-950 font-medium"
                      : "bg-zinc-800 text-zinc-200 border border-zinc-700/50"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {settings.allowChat ? (
        <form
          onSubmit={handleSend}
          className="p-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={messageText}
            disabled={slowModeCountdown > 0 && !isHostOrMod}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={
              slowModeCountdown > 0 && !isHostOrMod
                ? `Slow mode active (${slowModeCountdown}s)...`
                : "Send message..."
            }
            className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={slowModeCountdown > 0 && !isHostOrMod}
            className="h-7 w-7 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Send className="w-3 h-3 ml-0.5" />
          </button>
        </form>
      ) : (
        <div className="p-2.5 bg-zinc-950 border-t border-zinc-800 text-center text-xs text-zinc-500 font-medium">
          Chat has been disabled by host.
        </div>
      )}
    </div>
  );
}
