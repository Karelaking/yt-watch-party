"use client";

import * as React from "react";
import { MessageSquare, Heart, Smile, Send } from "lucide-react";

export function ChatMock(): React.JSX.Element {
  const [messages, setMessages] = React.useState([
    { user: "Alex", text: "Bro wait for me to grab popcorn 🍿", time: "Just now", self: false },
    { user: "Sarah", text: "Synced up perfectly! That drop was insane 🔥", time: "1s ago", self: true },
  ]);

  return (
    <div className="w-55 sm:w-62.5 text-zinc-900 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-100">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-zinc-900" />
          <span className="text-[11px] font-bold text-zinc-900">Room Chat</span>
        </div>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </div>

      {/* Message Bubbles */}
      <div className="space-y-2 mb-3">
        <div className="flex flex-col items-start">
          <span className="text-[9px] font-bold text-zinc-400 ml-1 mb-0.5">Alex</span>
          <div className="bg-zinc-100 text-zinc-800 text-[11px] px-2.5 py-1.5 rounded-2xl rounded-tl-xs leading-relaxed max-w-[90%] shadow-2xs">
            Wait for me to grab popcorn! 🍿
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[9px] font-bold text-zinc-400 mr-1 mb-0.5">You</span>
          <div className="bg-zinc-900 text-white text-[11px] px-2.5 py-1.5 rounded-2xl rounded-tr-xs leading-relaxed max-w-[90%] shadow-2xs">
            Synced perfectly! That drop was crazy 🔥
          </div>
        </div>
      </div>

      {/* Mock input box */}
      <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-full px-2.5 py-1 text-[10px] text-zinc-400">
        <Smile className="w-3 h-3 text-zinc-400 hover:text-zinc-600 cursor-pointer" />
        <span className="flex-1 text-zinc-400">Type a message...</span>
        <div className="h-5 w-5 rounded-full bg-zinc-900 text-white flex items-center justify-center cursor-pointer hover:bg-zinc-800">
          <Send className="w-2.5 h-2.5 ml-0.5" />
        </div>
      </div>
    </div>
  );
}
