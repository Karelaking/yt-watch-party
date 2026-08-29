"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Plus, Tv, Moon, Sun, Home, ArrowRight } from "lucide-react";
import type { Room } from "@/lib/contract-types";
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

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  rooms?: Room[];
  onCreateRoom?: () => void;
}

export function CommandMenu({
  isOpen,
  onClose,
  rooms = [],
  onCreateRoom,
}: CommandMenuProps): React.JSX.Element | null {
  const [query, setQuery] = React.useState("");
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();

  // Global Cmd+K / Ctrl+K shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          const event = new CustomEvent("open-command-menu");
          window.dispatchEvent(event);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTheme = resolvedTheme || theme || "light";

  const staticActions = [
    {
      id: "action-create",
      title: "Create Watch Room",
      subtitle: "Start a new synchronized streaming session",
      icon: Plus,
      shortcut: "⌘N",
      onSelect: () => {
        onClose();
        onCreateRoom?.();
      },
    },
    {
      id: "action-theme",
      title: currentTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      subtitle: "Toggle application theme",
      icon: currentTheme === "dark" ? Sun : Moon,
      shortcut: "⌘T",
      onSelect: () => {
        setTheme(currentTheme === "dark" ? "light" : "dark");
        onClose();
      },
    },
    {
      id: "action-home",
      title: "Go to Home",
      subtitle: "Navigate to landing page",
      icon: Home,
      shortcut: "⌘H",
      onSelect: () => {
        onClose();
        router.push("/");
      },
    },
  ];

  const matchedRooms = rooms
    .filter(
      (r) =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.code.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5);

  const filteredActions = staticActions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Type a command or search rooms..."
      />
      <CommandList>
        {matchedRooms.length === 0 && filteredActions.length === 0 && (
          <CommandEmpty>No matching commands or rooms found.</CommandEmpty>
        )}

        {matchedRooms.length > 0 && (
          <CommandGroup heading="Rooms">
            {matchedRooms.map((room) => (
              <CommandItem
                key={room.id}
                onSelect={() => {
                  onClose();
                  router.push(`/room/${room.id}`);
                }}
              >
                <Tv className="mr-2 h-4 w-4 text-zinc-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-zinc-200 truncate">{room.name}</span>
                  <span className="text-[10px] text-zinc-400 truncate">
                    Code: {room.code}
                  </span>
                </div>
                <CommandShortcut>
                  <ArrowRight className="w-3 h-3 inline ml-1" />
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredActions.length > 0 && (
          <>
            {matchedRooms.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Actions">
              {filteredActions.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    onSelect={action.onSelect}
                  >
                    <Icon className="mr-2 h-4 w-4 text-zinc-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-zinc-200 truncate">
                        {action.title}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate">
                        {action.subtitle}
                      </span>
                    </div>
                    {action.shortcut && (
                      <CommandShortcut>{action.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
