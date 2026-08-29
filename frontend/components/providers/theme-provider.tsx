"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

export interface ThemeProviderProps {
  children: React.ReactNode;
}

function ThemeHotkeyListener(): null {
  const { theme, resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable ||
          target.getAttribute("role") === "textbox")
      ) {
        return;
      }

      // Support 'd' or 'Cmd+Shift+D' / 'Ctrl+Shift+D' for dark-mode toggle
      const isDKey = event.key === "d" || event.key === "D";
      const isModShiftD = (event.metaKey || event.ctrlKey) && event.shiftKey && isDKey;
      const isBareD = !event.metaKey && !event.ctrlKey && !event.altKey && isDKey;

      if (isModShiftD || isBareD) {
        event.preventDefault();
        const current = resolvedTheme || theme || "light";
        setTheme(current === "dark" ? "light" : "dark");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [theme, resolvedTheme, setTheme]);

  return null;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeHotkeyListener />
      {children}
    </NextThemesProvider>
  );
}

export { useTheme };
