"use client";

import * as React from "react";

export interface KeyboardShortcutsHandlers {
  onTogglePlay?: () => void;
  onSkipBackward?: () => void;
  onSkipForward?: () => void;
  onToggleMute?: () => void;
  onToggleFullscreen?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onTogglePlay,
  onSkipBackward,
  onSkipForward,
  onToggleMute,
  onToggleFullscreen,
  enabled = true,
}: KeyboardShortcutsHandlers) {
  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        onTogglePlay?.();
      } else if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        onSkipBackward?.();
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        onSkipForward?.();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        onToggleMute?.();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        onToggleFullscreen?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    onTogglePlay,
    onSkipBackward,
    onSkipForward,
    onToggleMute,
    onToggleFullscreen,
  ]);
}
