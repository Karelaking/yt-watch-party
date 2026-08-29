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
  const [quickCode, setQuickCode] = React.useState("");
  const [isJoining, setIsJoining] = React.useState(false);
  const [joinError, setJoinError] = React.useState<string | null>(null);

  const handleQuickJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCode.trim() || isJoining) return;
    const clean = quickCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    setIsJoining(true);
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
      setIsJoining(false);
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
    <div className="min-h-screen flex flex-col bg-zinc-50/50 text-zinc-950 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Top Navbar */}
      <DashboardNav
        onCreateClick={() => setIsCreateModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 select-none">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950">
              Watch Rooms
            </h1>
            <p className="text-xs text-zinc-500">
              Join live streams or create a synchronized session for your group
            </p>
          </div>

          {/* Quick Join Code Input */}
          <div className="flex flex-col items-end gap-1 max-w-xs w-full">
            <form
              onSubmit={handleQuickJoin}
              className="flex items-center gap-2 bg-white border border-zinc-200 p-1 rounded-lg shadow-2xs w-full"
            >
              <input
                type="text"
                placeholder="Join by code (e.g. K4M2X8)..."
                value={quickCode}
                onChange={(e) => {
                  setQuickCode(e.target.value);
                  if (joinError) setJoinError(null);
                }}
                disabled={isJoining}
                className="flex-1 px-2.5 py-1 text-xs bg-transparent outline-none font-mono text-zinc-900 placeholder:text-zinc-400 disabled:opacity-50 uppercase"
              />
              <button
                type="submit"
                disabled={!quickCode.trim() || isJoining}
                className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1 shrink-0"
              >
                {isJoining && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{isJoining ? "Joining..." : "Join"}</span>
              </button>
            </form>
            {joinError && (
              <p className="text-[11px] text-red-600 font-medium px-1 animate-in fade-in duration-150">
                {joinError}
              </p>
            )}
          </div>
        </div>

        {/* Server Reachability Warning */}
        {roomsError && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 animate-in fade-in duration-150">
            <WifiOff className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="text-xs space-y-0.5">
              <p className="font-semibold">
                Cannot reach the WatchParty server
              </p>
              <p className="text-amber-700">
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
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-zinc-200">
          <div className="flex items-center gap-1 p-1 bg-zinc-200/50 rounded-lg border border-zinc-200 text-xs font-medium">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-white text-zinc-950 shadow-2xs font-semibold"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              All ({rooms.length})
            </button>
            <button
              onClick={() => setActiveTab("PUBLIC")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "PUBLIC"
                  ? "bg-white text-zinc-950 shadow-2xs font-semibold"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              Public ({publicRoomsCount})
            </button>
            <button
              onClick={() => setActiveTab("MY_ROOMS")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "MY_ROOMS"
                  ? "bg-white text-zinc-950 shadow-2xs font-semibold"
                  : "text-zinc-600 hover:text-zinc-950"
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
          <div className="bg-white rounded-xl border border-dashed border-zinc-200 p-12 text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
              <Tv className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-semibold text-sm text-zinc-900">
                No rooms found
              </h3>
              <p className="text-xs text-zinc-500">
                Create a new watch room or try another search term
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
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
    </div>
  );
}
