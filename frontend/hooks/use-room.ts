"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api-client";
import { normalizeRoom, type Room } from "@/lib/contract-types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function useRoom(roomIdOrCode: string): {
  room: Room | null;
  setRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  refreshRoom: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
} {
  const { getToken } = useAuth();
  const [room, setRoom] = React.useState<Room | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refreshRoom = React.useCallback(async () => {
    if (!roomIdOrCode) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();

      const cleanInput = roomIdOrCode.trim();
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          cleanInput
        );

      let roomRes: ApiResponse<{ room: any; settings: any }>;

      if (!isUuid) {
        // Query by room code
        const code = cleanInput.toUpperCase();
        roomRes = await apiClient.get<ApiResponse<{ room: any; settings: any }>>(
          `/rooms/code/${code}`,
          token
        );
      } else {
        // Query by room UUID
        try {
          roomRes = await apiClient.get<ApiResponse<{ room: any; settings: any }>>(
            `/rooms/${cleanInput}`,
            token
          );
        } catch (_idErr) {
          // Fallback to code lookup just in case
          const code = cleanInput.toUpperCase();
          roomRes = await apiClient.get<ApiResponse<{ room: any; settings: any }>>(
            `/rooms/code/${code}`,
            token
          );
        }
      }

      if (!roomRes?.data?.room) {
        throw new Error("Room not found");
      }

      const rawRoom = roomRes.data.room;
      const rawSettings = roomRes.data.settings;
      const targetRoomId = rawRoom.id;

      // Fetch ancillary data in parallel (media, playlists, playback, members, chat)
      const [mediaRes, playlistRes, playbackRes, membersRes, chatRes] =
        await Promise.allSettled([
          apiClient.get<ApiResponse<any[]>>(`/media/rooms/${targetRoomId}`, token),
          apiClient.get<ApiResponse<any[]>>(`/playlists/rooms/${targetRoomId}`, token),
          apiClient.get<ApiResponse<any>>(`/playback/rooms/${targetRoomId}`, token),
          apiClient.get<ApiResponse<any[]>>(`/memberships/rooms/${targetRoomId}/members`, token),
          apiClient.get<ApiResponse<any[]>>(`/chat/rooms/${targetRoomId}/messages`, token),
        ]);

      const media =
        mediaRes.status === "fulfilled" && Array.isArray(mediaRes.value?.data)
          ? mediaRes.value.data
          : [];

      const playlists =
        playlistRes.status === "fulfilled" && Array.isArray(playlistRes.value?.data)
          ? playlistRes.value.data
          : [];

      const playbackState =
        playbackRes.status === "fulfilled" && playbackRes.value?.data
          ? playbackRes.value.data
          : null;

      const memberships =
        membersRes.status === "fulfilled" && Array.isArray(membersRes.value?.data)
          ? membersRes.value.data
          : [];

      const rawChatData = chatRes.status === "fulfilled" ? chatRes.value?.data : null;
      const rawChatList = Array.isArray(rawChatData)
        ? rawChatData
        : Array.isArray((rawChatData as any)?.messages)
        ? (rawChatData as any).messages
        : [];

      const chatMessages = rawChatList.map((m: any) => ({
        id: m.id || m._id,
        roomId: targetRoomId,
        userId: m.senderId || m.userId,
        userName: m.senderName || m.userName || "User",
        userAvatar: m.userAvatar || null,
        userRole: m.userRole || "PARTICIPANT",
        content: m.message || m.content || m.text || "",
        createdAt: typeof m.createdAt === "string" ? m.createdAt : new Date(m.createdAt || Date.now()).toISOString(),
      }));

      const fullRoomData = {
        ...rawRoom,
        media,
        playlists,
        playbackState,
        memberships,
        chatMessages,
      };

      const normalized = normalizeRoom(fullRoomData, rawSettings);
      setRoom(normalized);
    } catch (err: any) {
      console.warn("[useRoom] Error fetching room:", err);
      setError(err?.message || "Failed to load room");
    } finally {
      setIsLoading(false);
    }
  }, [roomIdOrCode, getToken]);

  React.useEffect(() => {
    refreshRoom();
  }, [refreshRoom]);

  return { room, setRoom, refreshRoom, isLoading, error };
}
