"use client";

import * as React from "react";
import { MessageSquare, Smile, Send } from "lucide-react";

export function ChatMock(): React.JSX.Element {
  const messages = React.useMemo(
    () => [
      { user: "Alex", text: "Wait for me to grab popcorn! 🍿", self: false },
      { user: "You", text: "Synced perfectly! That drop was crazy 🔥", self: true },
    ],
    []
  );

  return (
    <div className="w-55 sm:w-62.5 text-zinc-900 dark:text-zinc-100 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
          <span className="text-[11px] font-bold text-zinc-900 dark:text-white">Room Chat</span>
        </div>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </div>

      {/* Message Bubbles */}
      <div className="space-y-2 mb-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.self ? "items-end" : "items-start"}`}>
            <span className={`text-[9px] font-bold text-zinc-400 mb-0.5 ${msg.self ? "mr-1" : "ml-1"}`}>
              {msg.user}
            </span>
            <div
              className={`text-[11px] px-2.5 py-1.5 rounded-2xl leading-relaxed max-w-[90%] shadow-2xs ${
                msg.self
                  ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-tr-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-xs"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Mock input box */}
      <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-2.5 py-1 text-[10px] text-zinc-400">
        <Smile className="w-3 h-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer" />
        <span className="flex-1 text-zinc-400">Type a message...</span>
        <div className="h-5 w-5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 flex items-center justify-center cursor-pointer">
          <Send className="w-2.5 h-2.5 ml-0.5" />
        </div>
      </div>
    </div>
  );
}
