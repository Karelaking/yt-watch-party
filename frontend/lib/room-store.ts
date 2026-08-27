"use client";

/**
 * @deprecated
 * This local-only storage module has been replaced by the real Express + Socket.IO
 * backend API integration. See `lib/api-client.ts`, `lib/socket-client.ts`,
 * `hooks/use-room.ts`, and `hooks/use-rooms.ts`.
 */

import {
  Room,
  RoomSettings,
  RoomRole,
  RoomVisibility,
  Media,
  Playlist,
  RoomEventType,
  RoomBan,
  RoomInvitation,
  RoleHistory,
  BanType,
} from "./contract-types";
import { generateRoomCode, parseMediaUrl } from "./youtube-utils";

const INITIAL_ROOMS: Room[] = [];
const STORAGE_KEY = "watchparty_rooms_data_v2";

let cachedRawRooms: string | null = null;
let cachedRooms: Room[] = INITIAL_ROOMS;

export function loadRooms(): Room[] {
  if (typeof window === "undefined") return INITIAL_ROOMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedRawRooms = null;
      cachedRooms = INITIAL_ROOMS;
      return INITIAL_ROOMS;
    }
    if (raw === cachedRawRooms) {
      return cachedRooms;
    }
    cachedRawRooms = raw;
    const parsed: Room[] = JSON.parse(raw);
    cachedRooms = parsed.map((r) => ({
      ...r,
      bans: r.bans || [],
      invitations: r.invitations || [],
      watchSessions: r.watchSessions || [],
      activeScreenShare: r.activeScreenShare || null,
    }));
    return cachedRooms;
  } catch {
    cachedRawRooms = null;
    cachedRooms = INITIAL_ROOMS;
    return INITIAL_ROOMS;
  }
}

export function saveRooms(rooms: Room[]) {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(rooms);
    cachedRawRooms = serialized;
    cachedRooms = rooms;
    localStorage.setItem(STORAGE_KEY, serialized);
    window.dispatchEvent(new Event("rooms_updated"));
  } catch (err) {
    console.error("Failed to save rooms", err);
  }
}

export function subscribeRooms(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("rooms_updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("rooms_updated", callback);
  };
}

export function getRoomsSnapshot(): Room[] {
  return loadRooms();
}

const SERVER_EMPTY: Room[] = [];
export function getRoomsServerSnapshot(): Room[] {
  return SERVER_EMPTY;
}

export function getRoom(idOrCode: string): Room | null {
  const rooms = loadRooms();
  const found = rooms.find(
    (r) =>
      r.id === idOrCode ||
      r.code.toLowerCase() === idOrCode.toLowerCase() ||
      (r.slug && r.slug.toLowerCase() === idOrCode.toLowerCase())
  );
  return found || null;
}

export function createNewRoom(params: {
  name: string;
  description?: string;
  youtubeId: string;
  sourceUrl: string;
  videoTitle?: string;
  visibility?: RoomVisibility;
  maxMembers?: number;
  settings?: Partial<RoomSettings>;
  ownerName?: string;
  ownerAvatar?: string;
  ownerId?: string;
}): Room {
  const rooms = loadRooms();
  const roomId = `room-${Date.now()}`;
  const roomCode = generateRoomCode();
  const ownerId = params.ownerId || `user-${Date.now()}`;
  const ownerName = params.ownerName || "WatchParty Host";
  const ownerAvatar = params.ownerAvatar || null;

  const parsed = parseMediaUrl(params.sourceUrl);

  const initialMedia: Media = {
    id: `media-${Date.now()}`,
    roomId,
    type: parsed?.type || "VIDEO",
    provider: parsed?.provider || "YOUTUBE",
    externalId: parsed?.externalId || params.youtubeId,
    sourceUrl: params.sourceUrl,
    title: params.videoTitle || parsed?.title || "Video Stream",
    thumbnailUrl: parsed?.thumbnailUrl || `https://img.youtube.com/vi/${params.youtubeId}/hqdefault.jpg`,
    duration: parsed?.duration || 600,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const initialPlaylist: Playlist = {
    id: `playlist-${Date.now()}`,
    roomId,
    createdById: ownerId,
    name: "Queue",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: `item-${Date.now()}`,
        playlistId: `playlist-${Date.now()}`,
        mediaId: initialMedia.id,
        media: initialMedia,
        position: 0,
        addedByName: ownerName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };

  const newRoom: Room = {
    id: roomId,
    code: roomCode,
    slug: params.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: params.name,
    description: params.description || null,
    ownerId,
    owner: {
      id: ownerId,
      clerkUserId: ownerId,
      username: ownerName.toLowerCase().replace(/\s+/g, "_"),
      displayName: ownerName,
      avatarUrl: ownerAvatar,
      email: null,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    status: "ACTIVE",
    visibility: params.visibility || "PUBLIC",
    maxMembers: params.maxMembers || 50,
    discoverable: params.visibility === "PUBLIC",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      id: `settings-${Date.now()}`,
      roomId,
      allowGuestJoin: true,
      requireApprovalToJoin: false,
      allowMemberInvite: true,
      allowChat: true,
      slowModeSeconds: 0,
      allowScreenShare: true,
      syncPlayback: true,
      autoplayNext: true,
      onlyHostCanControlPlayback: false,
      allowModeratorPlaybackControl: true,
      allowPlaylistControl: true,
      onlyHostCanManagePlaylist: false,
      disconnectOnHostLeave: false,
      autoArchive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...params.settings,
    },
    media: [initialMedia],
    playlists: [initialPlaylist],
    playbackState: {
      id: `pb-${Date.now()}`,
      roomId,
      mediaId: initialMedia.id,
      position: 0,
      isPlaying: true,
      playbackRate: 1.0,
      version: 1,
      serverTimestamp: new Date().toISOString(),
      lastAction: "PLAY",
      lastActionByName: ownerName,
      updatedAt: new Date().toISOString(),
    },
    memberships: [
      {
        id: `mem-${Date.now()}`,
        roomId,
        userId: ownerId,
        user: {
          id: ownerId,
          clerkUserId: ownerId,
          username: ownerName.toLowerCase().replace(/\s+/g, "_"),
          displayName: ownerName,
          avatarUrl: ownerAvatar,
          email: null,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        role: "HOST",
        status: "ACTIVE",
        nickname: `${ownerName} (Host)`,
        joinedAt: new Date().toISOString(),
        roleHistory: [],
      },
    ],
    chatMessages: [],
    bans: [],
    invitations: [],
    watchSessions: [
      {
        id: `ws-${Date.now()}`,
        roomId,
        userId: ownerId,
        userName: ownerName,
        status: "ACTIVE",
        joinedAt: new Date().toISOString(),
        totalWatchSeconds: 0,
      },
    ],
    events: [
      {
        id: `ev-${Date.now()}`,
        roomId,
        type: "ROOM_CREATED",
        actorName: ownerName,
        createdAt: new Date().toISOString(),
      },
    ],
  };

  const updatedRooms = [newRoom, ...rooms];
  saveRooms(updatedRooms);
  return newRoom;
}

export function updateRoomState(
  roomId: string,
  updater: (prev: Room) => Room
): Room | null {
  const rooms = loadRooms();
  const index = rooms.findIndex((r) => r.id === roomId);
  if (index === -1) return null;
  const updated = updater(rooms[index]);
  const newRooms = [...rooms];
  newRooms[index] = updated;
  saveRooms(newRooms);
  return updated;
}

// -------------------------------------------------------------
// Granular Actions mapped to Prisma Models
// -------------------------------------------------------------

export function recordRoomEvent(
  roomId: string,
  type: RoomEventType,
  actorName: string,
  payload?: unknown
) {
  updateRoomState(roomId, (prev) => ({
    ...prev,
    events: [
      {
        id: `ev-${Date.now()}`,
        roomId,
        type,
        actorName,
        payload,
        createdAt: new Date().toISOString(),
      },
      ...prev.events,
    ],
  }));
}

export function updateMemberRole(
  roomId: string,
  targetUserId: string,
  newRole: RoomRole,
  actorId: string,
  actorName: string
) {
  updateRoomState(roomId, (prev) => {
    const mem = prev.memberships.find((m) => m.userId === targetUserId);
    if (!mem) return prev;

    const previousRole = mem.role;
    const historyEntry: RoleHistory = {
      id: `rh-${Date.now()}`,
      membershipId: mem.id,
      previousRole,
      newRole,
      changedById: actorId,
      changedByName: actorName,
      changedAt: new Date().toISOString(),
    };

    const updatedMemberships = prev.memberships.map((m) =>
      m.userId === targetUserId
        ? {
            ...m,
            role: newRole,
            roleHistory: [...(m.roleHistory || []), historyEntry],
          }
        : m
    );

    return {
      ...prev,
      memberships: updatedMemberships,
      events: [
        {
          id: `ev-${Date.now()}`,
          roomId,
          type: "ROLE_ASSIGNED",
          actorName,
          payload: { targetUserId, previousRole, newRole },
          createdAt: new Date().toISOString(),
        },
        ...prev.events,
      ],
      chatMessages: [
        ...prev.chatMessages,
        {
          id: `msg-${Date.now()}`,
          roomId,
          userId: "system",
          userName: "System",
          userRole: "MODERATOR",
          content: `🛡️ ${mem.nickname || mem.user.displayName} is now a ${newRole}`,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  });
}

export function transferRoomHost(
  roomId: string,
  newHostUserId: string,
  currentHostName: string
) {
  updateRoomState(roomId, (prev) => {
    const target = prev.memberships.find((m) => m.userId === newHostUserId);
    if (!target) return prev;

    const updatedMemberships = prev.memberships.map((m) => {
      if (m.userId === newHostUserId) return { ...m, role: "HOST" as RoomRole };
      if (m.role === "HOST") return { ...m, role: "MODERATOR" as RoomRole };
      return m;
    });

    return {
      ...prev,
      ownerId: newHostUserId,
      memberships: updatedMemberships,
      events: [
        {
          id: `ev-${Date.now()}`,
          roomId,
          type: "HOST_TRANSFERRED",
          actorName: currentHostName,
          payload: { newHostUserId },
          createdAt: new Date().toISOString(),
        },
        ...prev.events,
      ],
      chatMessages: [
        ...prev.chatMessages,
        {
          id: `msg-${Date.now()}`,
          roomId,
          userId: "system",
          userName: "System",
          userRole: "HOST",
          content: `👑 Room host transferred to ${target.nickname || target.user.displayName}`,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  });
}

export function kickRoomMember(
  roomId: string,
  userId: string,
  actorName: string
) {
  updateRoomState(roomId, (prev) => {
    const mem = prev.memberships.find((m) => m.userId === userId);
    return {
      ...prev,
      memberships: prev.memberships.filter((m) => m.userId !== userId),
      events: [
        {
          id: `ev-${Date.now()}`,
          roomId,
          type: "USER_REMOVED",
          actorName,
          payload: { userId },
          createdAt: new Date().toISOString(),
        },
        ...prev.events,
      ],
      chatMessages: [
        ...prev.chatMessages,
        {
          id: `msg-${Date.now()}`,
          roomId,
          userId: "system",
          userName: "System",
          userRole: "MODERATOR",
          content: `🚪 ${mem?.nickname || mem?.user.displayName || "User"} was removed from the room.`,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  });
}

export function banRoomMember(
  roomId: string,
  userId: string,
  userName: string,
  reason: string,
  type: BanType,
  actorId: string,
  actorName: string,
  expiresAt?: string | null
) {
  updateRoomState(roomId, (prev) => {
    const newBan: RoomBan = {
      id: `ban-${Date.now()}`,
      roomId,
      userId,
      userName,
      createdById: actorId,
      createdByName: actorName,
      type,
      reason,
      expiresAt: expiresAt || null,
      createdAt: new Date().toISOString(),
    };

    return {
      ...prev,
      memberships: prev.memberships.filter((m) => m.userId !== userId),
      bans: [newBan, ...(prev.bans || [])],
      events: [
        {
          id: `ev-${Date.now()}`,
          roomId,
          type: "USER_BANNED",
          actorName,
          payload: { userId, reason, type },
          createdAt: new Date().toISOString(),
        },
        ...prev.events,
      ],
      chatMessages: [
        ...prev.chatMessages,
        {
          id: `msg-${Date.now()}`,
          roomId,
          userId: "system",
          userName: "System",
          userRole: "MODERATOR",
          content: `🚫 ${userName} was banned from the room. (${reason || "Violation"})`,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  });
}

export function createRoomInvitation(
  roomId: string,
  inviterId: string,
  inviterName: string,
  inviteeEmail?: string,
  expiresHours: number = 24
): RoomInvitation {
  const token = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/room/${roomId}?inv=${token}`;

  const expiresDate = new Date();
  expiresDate.setHours(expiresDate.getHours() + expiresHours);

  const newInvitation: RoomInvitation = {
    id: `inv-id-${Date.now()}`,
    roomId,
    inviterId,
    inviterName,
    inviteeEmail: inviteeEmail || null,
    tokenHash: token,
    inviteUrl,
    status: "PENDING",
    expiresAt: expiresDate.toISOString(),
    createdAt: new Date().toISOString(),
  };

  updateRoomState(roomId, (prev) => ({
    ...prev,
    invitations: [newInvitation, ...(prev.invitations || [])],
  }));

  return newInvitation;
}

export function reorderPlaylistItem(
  roomId: string,
  playlistId: string,
  itemId: string,
  direction: "UP" | "DOWN"
) {
  updateRoomState(roomId, (prev) => {
    const playlist = prev.playlists.find((pl) => pl.id === playlistId);
    if (!playlist) return prev;

    const items = [...playlist.items];
    const index = items.findIndex((it) => it.id === itemId);
    if (index === -1) return prev;

    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return prev;

    // Swap
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    // Reassign position index
    items.forEach((it, idx) => {
      it.position = idx;
    });

    return {
      ...prev,
      playlists: prev.playlists.map((pl) =>
        pl.id === playlistId ? { ...pl, items } : pl
      ),
      events: [
        {
          id: `ev-${Date.now()}`,
          roomId,
          type: "PLAYLIST_ITEM_REORDERED",
          actorName: "User",
          createdAt: new Date().toISOString(),
        },
        ...prev.events,
      ],
    };
  });
}
