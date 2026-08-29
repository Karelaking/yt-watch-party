"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Laptop } from "lucide-react";

export function ThemeToggle({
  className = "",
}: {
  className?: string;
}): React.JSX.Element {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 ${className}`} />
    );
  }

  const handleToggle = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const isSystem = theme === "system";
  const isDark = (resolvedTheme || theme) === "dark";

  const getTooltip = () => {
    if (isSystem) {
      return `Theme: System (${resolvedTheme || "auto"}) — Click for Light (D)`;
    }
    if (theme === "light") {
      return "Theme: Light — Click for Dark (D)";
    }
    return "Theme: Dark — Click for System (D)";
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={getTooltip()}
      title={getTooltip()}
      className={`relative p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-zinc-600 ${className}`}
    >
      {isSystem ? (
        <Laptop className="h-4 w-4 text-zinc-600 dark:text-zinc-300 transition-transform duration-300" />
      ) : isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-zinc-700 dark:text-zinc-300 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
      {isSystem && (
        <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      )}
    </button>
  );
}
