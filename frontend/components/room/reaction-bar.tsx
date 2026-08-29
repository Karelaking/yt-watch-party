"use client";

import * as React from "react";
import confetti from "canvas-confetti";

interface ReactionBarProps {
  onTriggerReaction: (emoji: string) => void;
}

const EMOJIS = ["🔥", "🍿", "❤️", "👏", "🚀", "😂", "🎉"];

export function ReactionBar({ onTriggerReaction }: ReactionBarProps): React.JSX.Element {
  const handleClick = (emoji: string) => {
    onTriggerReaction(emoji);
    if (emoji === "🎉") {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 },
      });
    }
  };

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl select-none shadow-xs">
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium mr-2 hidden sm:inline">
          Reactions:
        </span>
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleClick(emoji)}
            className="h-8 w-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-sm flex items-center justify-center transition-transform hover:scale-115 active:scale-95 cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
        Click to react live
      </span>
    </div>
  );
}
