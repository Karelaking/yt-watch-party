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

export function useRooms(): { rooms: Room[]; error: string | null } {
  const { isSignedIn, getToken } = useAuth();
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const fetchRooms = React.useCallback(async () => {
    try {
      const publicRes = await apiClient.get<ApiResponse<any[]>>("/rooms/public");
      let allRawRooms = Array.isArray(publicRes?.data) ? publicRes.data : [];

      if (isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            const myRes = await apiClient.get<ApiResponse<any[]>>("/rooms/my", token);
            if (Array.isArray(myRes?.data)) {
              const myRoomIds = new Set(myRes.data.map((r) => r.id));
              allRawRooms = [
                ...myRes.data,
                ...allRawRooms.filter((r) => !myRoomIds.has(r.id)),
              ];
            }
          }
        } catch {
          // If my rooms fails, still show public rooms
        }
      }

      setRooms(allRawRooms.map((r) => normalizeRoom(r)));
      setError(null);
    } catch (err: any) {
      console.warn("[useRooms] Failed to fetch rooms from backend:", err);
      setError(
        err?.message ||
          "Couldn't reach the WatchParty server. Check that it's running and reachable from this device."
      );
    }
  }, [isSignedIn, getToken]);

  React.useEffect(() => {
    fetchRooms();

    const handleFocus = () => fetchRooms();
    const handleCustomUpdate = () => fetchRooms();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("rooms_updated", handleCustomUpdate);

    const interval = setInterval(fetchRooms, 5000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("rooms_updated", handleCustomUpdate);
      clearInterval(interval);
    };

  }, [fetchRooms]);

  return { rooms, error };
}
