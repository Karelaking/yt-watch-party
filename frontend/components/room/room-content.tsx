"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import type {
  Room,
  RoomRole,
  RoomSettings,
  Media,
  PlaylistItem,
  ChatMessage,
  BanType,
  RoomMembership,
} from "@/lib/contract-types";
import { apiClient } from "@/lib/api-client";
import { parseMediaUrl } from "@/lib/youtube-utils";
import { useRoom } from "@/hooks/use-room";
import { useSocket } from "@/hooks/use-socket";
import type { PlaybackStateSnapshot } from "@/lib/socket-client";
import { RoomHeader } from "./room-header";
import { YouTubeSyncPlayer } from "./youtube-sync-player";
import { ReactionBar } from "./reaction-bar";
import { RoomSidebar } from "./room-sidebar";
import { RoomSettingsModal } from "./room-settings-modal";
import { RoomInviteModal } from "./room-invite-modal";
import { ArrowLeft, Loader2, Tv } from "lucide-react";

interface FloatingParticle {
  id: string;
  emoji: string;
  left: number;
}

interface RoomContentProps {
  roomId: string;
}

export function RoomContent({ roomId }: RoomContentProps): React.JSX.Element {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { socket, isConnected } = useSocket();
  const { room, setRoom, isLoading } = useRoom(roomId);
  const reactionCountRef = React.useRef(0);

  const [floatingReactions, setFloatingReactions] = React.useState<FloatingParticle[]>([]);
  const [isScreenSharing, setIsScreenSharing] = React.useState(false);
  const [screenStream, setScreenStream] = React.useState<MediaStream | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);

  const currentUserId = user?.id || "guest-user";
  const currentUserName = user?.fullName || user?.username || "Guest Watcher";
  const currentUserAvatar = user?.imageUrl || null;

  // Real-time Socket Event Subscription
  React.useEffect(() => {
    if (!socket || !room?.id) return;

    // Join room channel & fetch authoritative playback state
    const joinRoomChannel = () => {
      socket.emit("room:join", { roomId: room.id }, (response) => {
        if (response?.success && response.state) {
          const state = response.state;
          setRoom((prev) => {
            if (!prev) return prev;
            const newMediaList = state.media && !prev.media.some((m) => m.id === state.media.id)
              ? [state.media, ...prev.media]
              : prev.media;

            return {
              ...prev,
              media: newMediaList,
              playbackState: {
                ...prev.playbackState,
                isPlaying: state.isPlaying,
                position: state.position,
                playbackRate: state.playbackRate,
                mediaId: state.mediaId ?? prev.playbackState.mediaId,
                media: state.media ?? prev.playbackState.media,
                version: state.version,
                serverTimestamp: typeof state.serverTimestamp === "string" ? state.serverTimestamp : new Date(state.serverTimestamp).toISOString(),
                lastAction: (state as any).lastAction ?? prev.playbackState.lastAction,
              },
            };
          });
        }
      });
    };

    joinRoomChannel();
    socket.on("connect", joinRoomChannel);

    // Handle authoritative playback sync events
    const handlePlaybackSync = (syncState: PlaybackStateSnapshot) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const newMediaList = syncState.media && !prev.media.some((m) => m.id === syncState.media.id)
          ? [syncState.media, ...prev.media]
          : prev.media;

        return {
          ...prev,
          media: newMediaList,
          playbackState: {
            ...prev.playbackState,
            isPlaying: syncState.isPlaying,
            position: syncState.position,
            playbackRate: syncState.playbackRate,
            mediaId: syncState.mediaId ?? prev.playbackState.mediaId,
            media: syncState.media ?? prev.playbackState.media,
            version: syncState.version,
            serverTimestamp: typeof syncState.serverTimestamp === "string" ? syncState.serverTimestamp : new Date(syncState.serverTimestamp).toISOString(),
            lastAction: (syncState as any).lastAction ?? prev.playbackState.lastAction,
          },
        };
      });
    };

    // Handle real-time playlist synchronization
    const handlePlaylistSync = (data: { playlistId: string; items: any[] }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const exists = prev.playlists.some((pl) => pl.id === data.playlistId);
        let updatedPlaylists;
        if (exists) {
          updatedPlaylists = prev.playlists.map((pl) =>
            pl.id === data.playlistId ? { ...pl, items: data.items } : pl
          );
        } else {
          updatedPlaylists = [
            {
              id: data.playlistId,
              roomId: prev.id,
              createdById: prev.ownerId,
              name: "Main Room Playlist",
              description: null,
              status: "ACTIVE" as const,
              items: data.items,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...prev.playlists,
          ];
        }
        return {
          ...prev,
          playlists: updatedPlaylists,
        };
      });
    };

    // Handle live room settings update
    const handleRoomSettingsUpdated = (data: { roomId: string; settings: any }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          settings: {
            ...prev.settings,
            ...data.settings,
          },
        };
      });
    };

    // Handle live floating emoji reaction
    const handleRoomReaction = (data: { userId: string; userName: string; emoji: string }) => {
      reactionCountRef.current += 1;
      const currentCount = reactionCountRef.current;
      const newParticle: FloatingParticle = {
        id: `p-${currentCount}-${Date.now()}`,
        emoji: data.emoji,
        left: ((currentCount * 23) % 70) + 15,
      };
      setFloatingReactions((prev) => {
        const sliced = prev.length >= 30 ? prev.slice(prev.length - 29) : prev;
        return [...sliced, newParticle];
      });

      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((p) => p.id !== newParticle.id));
      }, 3500);
    };

    // Handle real-time chat messages
    const handleChatMessage = (msg: {
      id: string;
      senderId: string;
      senderName: string;
      text: string;
      sentAt: string;
    }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        if (prev.chatMessages.some((m) => m.id === msg.id)) return prev;

        const newChatMessage: ChatMessage = {
          id: msg.id,
          roomId: prev.id,
          userId: msg.senderId,
          userName: msg.senderName,
          userAvatar: null,
          userRole: prev.ownerId === msg.senderId ? "HOST" : "PARTICIPANT",
          content: msg.text,
          createdAt: msg.sentAt,
        };

        return {
          ...prev,
          chatMessages: [...prev.chatMessages, newChatMessage],
        };
      });
    };

    // Handle member join / leave / role change
    const handleMemberJoined = (data: {
      userId: string;
      role: string;
      displayName?: string | null;
    }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const exists = prev.memberships.some((m) => m.userId === data.userId);
        if (exists) return prev;

        const newMem: RoomMembership = {
          id: `mem-${data.userId}-${Date.now()}`,
          roomId: prev.id,
          userId: data.userId,
          user: {
            id: data.userId,
            clerkUserId: data.userId,
            username: data.displayName?.toLowerCase().replace(/\s+/g, "_") || "user",
            displayName: data.displayName || "User",
            avatarUrl: null,
            email: null,
            status: "ACTIVE",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          role: (data.role as RoomRole) || "PARTICIPANT",
          status: "ACTIVE",
          nickname: data.displayName || null,
          joinedAt: new Date().toISOString(),
        };

        return {
          ...prev,
          memberships: [...prev.memberships, newMem],
        };
      });
    };

    const handleMemberLeft = (data: { userId: string }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          memberships: prev.memberships.filter((m) => m.userId !== data.userId),
        };
      });
    };

    const handleRoleChanged = (data: { userId: string; newRole: string }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          memberships: prev.memberships.map((m) =>
            m.userId === data.userId ? { ...m, role: data.newRole as RoomRole } : m
          ),
        };
      });
    };

    const handlePlaybackAction = (data: {
      actorId: string;
      action: string;
      position: number;
      playbackRate?: number;
      mediaId?: string | null;
      version: number;
    }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        if (data.version < prev.playbackState.version) return prev;
        return {
          ...prev,
          playbackState: {
            ...prev.playbackState,
            isPlaying: data.action === "PLAY" ? true : data.action === "PAUSE" ? false : prev.playbackState.isPlaying,
            position: data.position !== undefined ? data.position : prev.playbackState.position,
            playbackRate: data.playbackRate !== undefined ? data.playbackRate : prev.playbackState.playbackRate,
            mediaId: data.mediaId !== undefined && data.mediaId !== null ? data.mediaId : prev.playbackState.mediaId,
            version: data.version,
            serverTimestamp: new Date().toISOString(),
            lastAction: data.action as any,
          },
        };
      });
    };

    socket.on("playback:sync", handlePlaybackSync);
    socket.on("playback:action", handlePlaybackAction);
    socket.on("playlist:sync", handlePlaylistSync);
    socket.on("room:settings_updated", handleRoomSettingsUpdated);
    socket.on("room:reaction", handleRoomReaction);
    socket.on("chat:message", handleChatMessage);
    socket.on("room:member_joined", handleMemberJoined);
    socket.on("room:member_left", handleMemberLeft);
    socket.on("room:role_changed", handleRoleChanged);

    // Heartbeat ticker to keep session active
    const heartbeatInterval = setInterval(() => {
      socket.emit("playback:heartbeat", {
        roomId: room.id,
        clientPosition: room.playbackState.position,
      });
    }, 15000);

    return () => {
      clearInterval(heartbeatInterval);
      socket.emit("room:leave", { roomId: room.id });
      socket.off("connect", joinRoomChannel);
      socket.off("playback:sync", handlePlaybackSync);
      socket.off("playback:action", handlePlaybackAction);
      socket.off("playlist:sync", handlePlaylistSync);
      socket.off("room:settings_updated", handleRoomSettingsUpdated);
      socket.off("room:reaction", handleRoomReaction);
      socket.off("chat:message", handleChatMessage);
      socket.off("room:member_joined", handleMemberJoined);
      socket.off("room:member_left", handleMemberLeft);
      socket.off("room:role_changed", handleRoleChanged);
    };
  }, [socket, room?.id, setRoom]);

  if (isLoading && !room) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          <p className="text-sm font-medium text-zinc-300">Connecting to Watch Party...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full p-8 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-2xl">
          <div className="h-10 w-10 rounded-full bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
            <Tv className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Watch Room Not Found</h2>
            <p className="text-xs text-zinc-400">
              The room <strong className="text-zinc-200">#{roomId}</strong> does not exist or has ended.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Determine user role
  const userMembership = room.memberships.find(
    (m) =>
      m.userId === currentUserId ||
      (m.user as any)?.clerkUserId === currentUserId ||
      (m.user as any)?.id === currentUserId
  );
  const isHost =
    room.ownerId === currentUserId ||
    (room.owner as any)?.clerkUserId === currentUserId ||
    (room.owner as any)?.id === currentUserId ||
    userMembership?.role === "HOST";
  const isMod = userMembership?.role === "MODERATOR";

  // WebRTC Screen Share Toggle
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        if (navigator.mediaDevices?.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
          setScreenStream(stream);
          setIsScreenSharing(true);

          stream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
            setScreenStream(null);
          };
        }
      } catch (err) {
        console.error("Screen share cancelled or unsupported", err);
      }
    }
  };

  // Live floating reaction trigger
  const handleTriggerReaction = (emoji: string) => {
    reactionCountRef.current += 1;
    const currentCount = reactionCountRef.current;
    const newParticle: FloatingParticle = {
      id: `p-${currentCount}`,
      emoji,
      left: ((currentCount * 23) % 70) + 15,
    };
    setFloatingReactions((prev) => [...prev, newParticle]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, 3500);

    if (socket && isConnected) {
      socket.emit("room:reaction", { roomId: room.id, emoji });
    }
  };

  // Playback sync change (emits to Socket.IO backend)
  const handlePlaybackChange = (
    isPlaying: boolean,
    position: number,
    playbackRate: number,
    action?: "PLAY" | "PAUSE" | "SEEK" | "CHANGE_RATE"
  ) => {
    const resolvedAction = action || (isPlaying ? "PLAY" : "PAUSE");

    // Optimistic local state update
    setRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        playbackState: {
          ...prev.playbackState,
          isPlaying,
          position,
          playbackRate,
          version: prev.playbackState.version + 1,
          serverTimestamp: new Date().toISOString(),
          lastAction: resolvedAction,
          lastActionByName: currentUserName,
        },
      };
    });

    if (socket && isConnected) {
      socket.emit(
        "playback:action",
        {
          roomId: room.id,
          action: resolvedAction,
          position,
          playbackRate,
          mediaId: room.playbackState.mediaId || activeMedia?.id || null,
        },
        (res) => {
          if (res && !res.success) {
            console.warn("[playback:action rejected]:", res.error);
          }
        }
      );
    }
  };

  // Change video stream
  const handleChangeVideo = async (newUrl: string) => {
    const parsed = parseMediaUrl(newUrl);
    if (!parsed) return;

    try {
      const token = await getToken();
      const res = await apiClient.post<any>(
        `/media/rooms/${room.id}`,
        {
          url: newUrl,
          title: parsed.title,
        },
        token
      );

      const savedMedia: Media = res?.data || {
        id: `media-${Date.now()}`,
        roomId: room.id,
        type: parsed.type,
        provider: parsed.provider,
        externalId: parsed.externalId,
        sourceUrl: newUrl,
        title: parsed.title,
        thumbnailUrl: parsed.thumbnailUrl,
        duration: parsed.duration || 600,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setRoom((prev) => {
        if (!prev) return prev;
        const exists = prev.media.some((m) => m.id === savedMedia.id);
        const nextMedia = exists ? prev.media : [savedMedia, ...prev.media];
        return {
          ...prev,
          media: nextMedia,
          playbackState: {
            ...prev.playbackState,
            mediaId: savedMedia.id,
            media: savedMedia,
            position: 0,
            isPlaying: true,
            version: prev.playbackState.version + 1,
            serverTimestamp: new Date().toISOString(),
            lastAction: "CHANGE_VIDEO",
            lastActionByName: currentUserName,
          },
        };
      });

      if (socket && isConnected) {
        socket.emit("playback:action", {
          roomId: room.id,
          action: "CHANGE_VIDEO",
          position: 0,
          mediaId: savedMedia.id,
        });
      }
    } catch (err) {
      console.warn("Failed to update media on server:", err);
    }
  };

  // Send message
  const handleSendMessage = async (text: string) => {
    if (!text || text.trim().length === 0) return;

    if (socket && isConnected) {
      socket.emit("chat:send", {
        roomId: room.id,
        text: text.trim(),
      });
    } else {
      // Fallback optimistic display
      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        roomId: room.id,
        userId: currentUserId,
        userName: userMembership?.nickname || currentUserName,
        userAvatar: currentUserAvatar,
        userRole: isHost ? "HOST" : isMod ? "MODERATOR" : "PARTICIPANT",
        content: text,
        createdAt: new Date().toISOString(),
      };

      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          chatMessages: [...prev.chatMessages, newMsg],
        };
      });
    }
  };

  // Add item to queue
  const handleAddPlaylistItem = async (mediaUrl: string) => {
    const parsed = parseMediaUrl(mediaUrl);
    if (!parsed) {
      alert("Invalid video link or video ID. Please check the URL and try again.");
      return;
    }

    const newMedia: Media = {
      id: `media-${Date.now()}`,
      roomId: room.id,
      type: parsed.type,
      provider: parsed.provider,
      externalId: parsed.externalId,
      sourceUrl: mediaUrl,
      title: parsed.title,
      thumbnailUrl: parsed.thumbnailUrl,
      duration: parsed.duration || 600,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRoom((prev) => {
      if (!prev) return prev;
      const playlist = prev.playlists[0];
      const newItem: PlaylistItem = {
        id: `item-${Date.now()}`,
        playlistId: playlist ? playlist.id : "pl-1",
        mediaId: newMedia.id,
        media: newMedia,
        position: playlist ? playlist.items.length : 0,
        addedByName: currentUserName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!playlist) {
        return {
          ...prev,
          playlists: [
            {
              id: "pl-1",
              roomId: prev.id,
              createdById: currentUserId,
              name: "Main Room Playlist",
              description: null,
              status: "ACTIVE",
              items: [newItem],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        };
      }

      return {
        ...prev,
        playlists: prev.playlists.map((pl) =>
          pl.id === playlist.id
            ? { ...pl, items: [...pl.items, newItem] }
            : pl
        ),
      };
    });

    if (socket && isConnected) {
      socket.emit("playlist:action", {
        roomId: room.id,
        playlistId: room.playlists[0]?.id,
        action: "ADD",
        payload: { url: mediaUrl, mediaUrl, title: parsed.title },
      }, (res: any) => {
        if (res && !res.success) {
          console.warn("Notice: playlist socket add:", res.error);
        }
      });
    } else {
      // Fallback: REST API when socket is not connected
      try {
        const token = await getToken();
        const plId = room.playlists[0]?.id;
        if (plId) {
          await apiClient.post(
            `/playlists/rooms/${room.id}/${plId}/items`,
            { mediaUrl, title: parsed.title },
            token
          );
        }
      } catch (err) {
        console.warn("Notice: playlist server sync:", err);
      }
    }
  };

  // Remove queue item
  const handleRemovePlaylistItem = async (itemId: string) => {
    setRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        playlists: prev.playlists.map((pl) => ({
          ...pl,
          items: pl.items.filter((it) => it.id !== itemId),
        })),
      };
    });

    if (socket && isConnected) {
      socket.emit("playlist:action", {
        roomId: room.id,
        playlistId: room.playlists[0]?.id,
        action: "REMOVE",
        payload: { itemId },
      });
    } else {
      // Fallback: REST API when socket is not connected
      try {
        const token = await getToken();
        await apiClient.delete(`/playlists/rooms/${room.id}/items/${itemId}`, token);
      } catch (err) {
        console.warn("Notice: playlist item remove sync:", err);
      }
    }
  };

  // Reorder queue item
  const handleReorderPlaylistItem = async (
    itemId: string,
    direction: "UP" | "DOWN"
  ) => {
    const playlist = room.playlists[0];
    if (!playlist) return;

    const items = [...playlist.items];
    const index = items.findIndex((it) => it.id === itemId);
    if (index === -1) return;

    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;
    items.forEach((it, idx) => {
      it.position = idx;
    });

    setRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        playlists: prev.playlists.map((pl) =>
          pl.id === playlist.id ? { ...pl, items } : pl
        ),
      };
    });

    if (socket && isConnected) {
      socket.emit("playlist:action", {
        roomId: room.id,
        playlistId: playlist.id,
        action: "REORDER",
        payload: { itemIds: items.map((it) => it.id) },
      });
    }
  };

  // Play queued item
  const handlePlayQueueItem = (mediaId: string) => {
    const targetMedia = room.playlists[0]?.items.find(
      (it) => it.media.id === mediaId || it.mediaId === mediaId
    )?.media;
    if (!targetMedia) return;

    setRoom((prev) => {
      if (!prev) return prev;
      const exists = prev.media.some((m) => m.id === targetMedia.id);
      const nextMedia = exists ? prev.media : [targetMedia, ...prev.media];
      return {
        ...prev,
        media: nextMedia,
        playbackState: {
          ...prev.playbackState,
          mediaId: targetMedia.id,
          media: targetMedia,
          position: 0,
          isPlaying: true,
          version: prev.playbackState.version + 1,
          serverTimestamp: new Date().toISOString(),
          lastAction: "CHANGE_VIDEO",
          lastActionByName: currentUserName,
        },
      };
    });

    if (socket && isConnected) {
      socket.emit("playback:action", {
        roomId: room.id,
        action: "CHANGE_VIDEO",
        position: 0,
        mediaId: targetMedia.id,
      });
    }
  };

  // Moderation Handlers
  const handleUpdateRole = async (targetUserId: string, role: RoomRole) => {
    setRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        memberships: prev.memberships.map((m) =>
          m.userId === targetUserId ? { ...m, role } : m
        ),
      };
    });

    try {
      const token = await getToken();
      await apiClient.patch(
        `/memberships/rooms/${room.id}/role`,
        { userId: targetUserId, newRole: role },
        token
      );
    } catch (err) {
      console.warn("Notice: role update sync:", err);
    }
  };

  const handleTransferHost = async (newHostId: string) => {
    setRoom((prev) => {
      if (!prev) return prev;
      const updatedMemberships = prev.memberships.map((m) => {
        if (m.userId === newHostId) return { ...m, role: "HOST" as RoomRole };
        if (m.role === "HOST") return { ...m, role: "MODERATOR" as RoomRole };
        return m;
      });

      return {
        ...prev,
        ownerId: newHostId,
        memberships: updatedMemberships,
      };
    });
  };

  const handleKickMember = async (targetUserId: string) => {
    setRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        memberships: prev.memberships.filter((m) => m.userId !== targetUserId),
      };
    });

    try {
      const token = await getToken();
      await apiClient.post(
        `/memberships/rooms/${room.id}/kick`,
        { userId: targetUserId },
        token
      );
    } catch (err) {
      console.warn("Notice: member kick sync:", err);
    }
  };

  const handleBanMember = async (
    targetUserId: string,
    userName: string,
    reason: string,
    type: BanType
  ) => {
    setRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        memberships: prev.memberships.filter((m) => m.userId !== targetUserId),
      };
    });

    try {
      const token = await getToken();
      await apiClient.post(
        `/memberships/rooms/${room.id}/ban`,
        { userId: targetUserId, reason, type },
        token
      );
    } catch (err) {
      console.warn("Notice: member ban sync:", err);
    }
  };

  const handleUpdateNickname = (newNickname: string) => {
    setRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        memberships: prev.memberships.map((m) =>
          m.userId === currentUserId ? { ...m, nickname: newNickname } : m
        ),
      };
    });
  };

  const handleUpdateRoomMeta = async (updates: Partial<Room>) => {
    setRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...updates,
      };
    });

    try {
      const token = await getToken();
      await apiClient.patch(`/rooms/${room.id}`, updates, token);
    } catch (err) {
      console.warn("Notice: room meta sync:", err);
    }
  };

  const handleUpdateSettings = async (settingsUpdates: Partial<RoomSettings>) => {
    setRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          ...settingsUpdates,
        },
      };
    });

    if (socket && isConnected) {
      socket.emit("room:settings_update", {
        roomId: room.id,
        settings: settingsUpdates,
      });
    }

    try {
      const token = await getToken();
      await apiClient.patch(`/rooms/${room.id}/settings`, settingsUpdates, token);
    } catch (err) {
      console.warn("Notice: settings sync:", err);
    }
  };

  const handleAutoplayNext = () => {
    const playlist = room.playlists[0];
    if (!playlist || playlist.items.length === 0) return;
    const nextItem = playlist.items[0];
    if (nextItem) {
      handlePlayQueueItem(nextItem.media.id);
      handleRemovePlaylistItem(nextItem.id);
    }
  };

  const handleDeleteRoom = async () => {
    try {
      const token = await getToken();
      await apiClient.delete(`/rooms/${room.id}`, token);
      router.push("/dashboard");
    } catch (err: any) {
      alert(err?.message || "Failed to delete room");
    }
  };

  const activeMedia =
    room.media.find((m) => m.id === room.playbackState.mediaId) ||
    room.playbackState.media ||
    room.media[0] ||
    null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans selection:bg-zinc-800 selection:text-white overflow-x-hidden">
      {/* Top Header */}
      <RoomHeader
        room={room}
        isHost={isHost}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInvite={() => setIsInviteOpen(true)}
        isScreenSharing={isScreenSharing}
        onToggleScreenShare={handleToggleScreenShare}
      />

      {/* Main Grid Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Cinema Player & Reactions (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <YouTubeSyncPlayer
            currentMedia={activeMedia}
            playbackState={room.playbackState}
            settings={room.settings}
            isHost={isHost}
            isHostOrMod={isHost || isMod}
            isScreenSharing={isScreenSharing}
            screenStream={screenStream}
            onPlaybackChange={handlePlaybackChange}
            onChangeVideo={handleChangeVideo}
            onAutoplayNext={handleAutoplayNext}
            floatingReactions={floatingReactions}
          />

          <ReactionBar onTriggerReaction={handleTriggerReaction} />
        </div>

        {/* 4-Tab Sidebar (4 cols) */}
        <div className="lg:col-span-4 h-140 sm:h-155 sticky top-16">
          <RoomSidebar
            room={room}
            currentUserId={currentUserId}
            isHost={isHost}
            isMod={isMod}
            onSendMessage={handleSendMessage}
            onAddPlaylistItem={handleAddPlaylistItem}
            onRemovePlaylistItem={handleRemovePlaylistItem}
            onReorderPlaylistItem={handleReorderPlaylistItem}
            onPlayQueueItem={handlePlayQueueItem}
            onUpdateMemberRole={handleUpdateRole}
            onTransferHost={handleTransferHost}
            onKickMember={handleKickMember}
            onBanMember={handleBanMember}
            onUpdateNickname={handleUpdateNickname}
          />
        </div>
      </main>

      {/* Settings Modal */}
      <RoomSettingsModal
        room={room}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateRoom={handleUpdateRoomMeta}
        onUpdateSettings={handleUpdateSettings}
        onDeleteRoom={handleDeleteRoom}
      />

      {/* Invite Modal */}
      <RoomInviteModal
        room={room}
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </div>
  );
}
