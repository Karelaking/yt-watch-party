"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Plus, Tv, Moon, Sun, Home } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";

export function AppCommandMenu(): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    const handleOpen = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener("open-command-menu", handleOpen);

    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-menu", handleOpen);
    };
  }, []);

  const currentTheme = resolvedTheme || theme || "light";

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              router.push("/dashboard");
            }}
          >
            <Plus className="mr-2 h-4 w-4 text-zinc-400" />
            <span>Create or Join Watch Room</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme(currentTheme === "dark" ? "light" : "dark");
              setOpen(false);
            }}
          >
            {currentTheme === "dark" ? (
              <Sun className="mr-2 h-4 w-4 text-zinc-400" />
            ) : (
              <Moon className="mr-2 h-4 w-4 text-zinc-400" />
            )}
            <span>
              {currentTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              router.push("/dashboard");
            }}
          >
            <Tv className="mr-2 h-4 w-4 text-zinc-400" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false);
              router.push("/");
            }}
          >
            <Home className="mr-2 h-4 w-4 text-zinc-400" />
            <span>Home</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
