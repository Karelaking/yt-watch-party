"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api-client";
import { useRooms } from "@/hooks/use-rooms";
import { DashboardNav } from "./dashboard-nav";
import { StatsBanner } from "./stats-banner";
import { RoomCard } from "./room-card";
import { CreateRoomModal } from "./create-room-modal";
import { CommandMenu } from "./command-menu";
import { Plus, Tv, Loader2, WifiOff } from "lucide-react";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function DashboardContent(): React.JSX.Element {
  const router = useRouter();
  const { user } = useUser();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { rooms, error: roomsError } = useRooms();

  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"ALL" | "PUBLIC" | "MY_ROOMS">("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = React.useState(false);
  const [quickCode, setQuickCode] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [joinError, setJoinError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleOpenCommandMenu = () => setIsCommandMenuOpen(true);
    window.addEventListener("open-command-menu", handleOpenCommandMenu);
    return () => window.removeEventListener("open-command-menu", handleOpenCommandMenu);
  }, []);

  const handleQuickJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCode.trim() || isPending) return;
    const clean = quickCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    setIsPending(true);
    setJoinError(null);

    try {
      // 1. Check if room is already cached in memory
      const found = rooms.find(
        (r) =>
          r.code.toUpperCase() === clean ||
          r.id.toLowerCase() === clean.toLowerCase()
      );

      if (found) {
        router.push(`/room/${found.id}`);
        return;
      }

      // 2. If signed in, join the room via the backend membership API
      if (isSignedIn) {
        try {
          const token = await getToken();
          const joinRes = await apiClient.post<ApiResponse<{ roomId?: string; id?: string }>>(
            "/memberships/join",
            { code: clean },
            token
          );
          const targetRoomId =
            (joinRes?.data as any)?.roomId ||
            (joinRes?.data as any)?.id ||
            (joinRes?.data as any)?.room?.id;
          if (targetRoomId) {
            router.push(`/room/${targetRoomId}`);
            return;
          }
        } catch (joinErr: any) {
          console.warn("Membership join notice:", joinErr);
        }
      }

      // 3. Fallback: resolve room by code
      const token = isSignedIn ? await getToken() : null;
      const roomRes = await apiClient.get<ApiResponse<{ room: { id: string } }>>(
        `/rooms/code/${clean}`,
        token
      );
      const targetRoomId = roomRes?.data?.room?.id;
      if (targetRoomId) {
        router.push(`/room/${targetRoomId}`);
      } else {
        router.push(`/room/${clean}`);
      }
    } catch (err: any) {
      console.error("Failed to join room by code:", err);
      setJoinError(err?.message || `No active room found with code "${clean}".`);
    } finally {
      setIsPending(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.description &&
        room.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const isPublic =
      room.visibility?.toUpperCase() === "PUBLIC" ||
      room.visibility === ("PUBLIC" as any);

    if (activeTab === "PUBLIC") return isPublic;

    if (activeTab === "MY_ROOMS") {
      if (!user) return false;
      const isOwner =
        room.ownerId === user.id ||
        (room.owner as any)?.clerkUserId === user.id ||
        (room.owner as any)?.id === user.id ||
        (room.owner as any)?.email === user.primaryEmailAddress?.emailAddress;
      const isMember = room.memberships?.some(
        (m) =>
          m.userId === user.id ||
          (m.user as any)?.clerkUserId === user.id ||
          (m.user as any)?.id === user.id ||
          (m.user as any)?.email === user.primaryEmailAddress?.emailAddress
      );
      const isInviteOnlyOrPrivate =
        room.visibility === "PRIVATE" ||
        room.visibility === "UNLISTED" ||
        (room.visibility as any) === "INVITE_ONLY";

      return isOwner || isMember || isInviteOnlyOrPrivate;
    }

    return true;
  });

  const publicRoomsCount = rooms.filter(
    (r) => r.visibility?.toUpperCase() === "PUBLIC" || r.visibility === ("PUBLIC" as any)
  ).length;

  const myRoomsCount = user
    ? rooms.filter((r) => {
        const isOwner =
          r.ownerId === user.id ||
          (r.owner as any)?.clerkUserId === user.id ||
          (r.owner as any)?.id === user.id ||
          (r.owner as any)?.email === user.primaryEmailAddress?.emailAddress;
        const isMember = r.memberships?.some(
          (m) =>
            m.userId === user.id ||
            (m.user as any)?.clerkUserId === user.id ||
            (m.user as any)?.id === user.id ||
            (m.user as any)?.email === user.primaryEmailAddress?.emailAddress
        );
        const isInviteOnlyOrPrivate =
          r.visibility === "PRIVATE" ||
          r.visibility === "UNLISTED" ||
          (r.visibility as any) === "INVITE_ONLY";

        return isOwner || isMember || isInviteOnlyOrPrivate;
      }).length
    : 0;

  const totalMembers = rooms.reduce((acc, r) => acc + (r.memberships?.length || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Top Navbar */}
      <DashboardNav
        onCreateClick={() => setIsCreateModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 select-none">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Watch Rooms
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Join live streams or create a synchronized session for your group
            </p>
          </div>

          {/* Quick Join Code Input */}
          <div className="flex flex-col items-end gap-1 max-w-xs w-full">
            <form
              onSubmit={handleQuickJoin}
              aria-busy={isPending}
              className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-zinc-950 dark:focus-within:ring-zinc-100 focus-within:border-zinc-950 dark:focus-within:border-zinc-100 p-1 rounded-lg shadow-2xs w-full transition-all"
            >
              <label htmlFor="quick-join-input" className="sr-only">
                Join room by 6-character code
              </label>
              <input
                id="quick-join-input"
                type="text"
                required
                minLength={4}
                maxLength={12}
                pattern="[A-Za-z0-9]{4,12}"
                title="Enter a valid room code"
                placeholder="Join by code (e.g. K4M2X8)..."
                value={quickCode}
                onChange={(e) => {
                  setQuickCode(e.target.value);
                  if (joinError) setJoinError(null);
                }}
                disabled={isPending}
                className="flex-1 px-2.5 py-1 text-xs bg-transparent outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-100 font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 disabled:opacity-50 uppercase"
              />
              <button
                type="submit"
                disabled={isPending || !quickCode.trim()}
                aria-disabled={isPending || !quickCode.trim()}
                className="bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold px-3 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1 shrink-0"
              >
                {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{isPending ? "Joining..." : "Join"}</span>
              </button>
            </form>
            {joinError && (
              <p
                role="alert"
                aria-live="polite"
                className="text-[11px] text-red-600 dark:text-red-400 font-medium px-1 animate-in fade-in duration-150"
              >
                {joinError}
              </p>
            )}
          </div>
        </div>

        {/* Server Reachability Warning */}
        {roomsError && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 animate-in fade-in duration-150">
            <WifiOff className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="text-xs space-y-0.5">
              <p className="font-semibold">
                Cannot reach the WatchParty server
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                Public rooms may be missing and joining by code may fail. Make
                sure the backend is running and reachable from this device.
              </p>
            </div>
          </div>
        )}

        {/* Stats Strip */}
        <StatsBanner
          activeRoomsCount={rooms.length}
          totalMembersCount={totalMembers}
        />

        {/* Filter Controls */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-1 p-1 bg-zinc-200/50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              All ({rooms.length})
            </button>
            <button
              onClick={() => setActiveTab("PUBLIC")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "PUBLIC"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              Public ({publicRoomsCount})
            </button>
            <button
              onClick={() => setActiveTab("MY_ROOMS")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "MY_ROOMS"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              My Rooms ({myRoomsCount})
            </button>
          </div>

          <span className="text-xs text-zinc-400">
            {filteredRooms.length} rooms available
          </span>
        </div>


        {/* Rooms Grid */}
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
              <Tv className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                No rooms found
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Create a new watch room or try another search term
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Room</span>
            </button>
          </div>
        )}
      </main>

      {/* Create Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Command Menu */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        rooms={rooms}
        onCreateRoom={() => setIsCreateModalOpen(true)}
      />
    </div>
  );
}
