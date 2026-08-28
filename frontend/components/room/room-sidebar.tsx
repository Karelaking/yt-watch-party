"use client";

import * as React from "react";
import type { Room, RoomRole, BanType } from "@/lib/contract-types";
import { MessageSquare, ListMusic, Users, Activity } from "lucide-react";
import { ChatTab } from "./sidebar/chat-tab";
import { QueueTab } from "./sidebar/queue-tab";
import { MembersTab } from "./sidebar/members-tab";
import { ActivityTab } from "./sidebar/activity-tab";

interface RoomSidebarProps {
  room: Room;
  currentUserId: string;
  isHost: boolean;
  isMod: boolean;
  onSendMessage: (text: string) => void;
  onAddPlaylistItem: (mediaUrl: string) => void;
  onRemovePlaylistItem: (itemId: string) => void;
  onReorderPlaylistItem: (itemId: string, direction: "UP" | "DOWN") => void;
  onPlayQueueItem: (mediaId: string) => void;
  onUpdateMemberRole: (userId: string, role: RoomRole) => void;
  onTransferHost: (userId: string) => void;
  onKickMember: (userId: string) => void;
  onBanMember: (userId: string, userName: string, reason: string, type: BanType) => void;
  onUpdateNickname: (newNickname: string) => void;
}

export function RoomSidebar({
  room,
  currentUserId,
  isHost,
  isMod,
  onSendMessage,
  onAddPlaylistItem,
  onRemovePlaylistItem,
  onReorderPlaylistItem,
  onPlayQueueItem,
  onUpdateMemberRole,
  onTransferHost,
  onKickMember,
  onBanMember,
  onUpdateNickname,
}: RoomSidebarProps): React.JSX.Element {
  const [activeTab, setActiveTab] = React.useState<
    "CHAT" | "QUEUE" | "MEMBERS" | "ACTIVITY"
  >("CHAT");

  const isHostOrMod = isHost || isMod;
  const canControl = isHostOrMod || !room.settings.onlyHostCanControlPlayback;
  const currentPlaylist = room.playlists[0] || null;

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden select-none text-white">
      {/* 4 Navigation Tabs */}
      <div className="grid grid-cols-4 p-1 bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-semibold">
        <button
          onClick={() => setActiveTab("CHAT")}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "CHAT"
              ? "bg-zinc-800 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <MessageSquare className="w-3 h-3" />
          <span>Chat</span>
        </button>

        <button
          onClick={() => setActiveTab("QUEUE")}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "QUEUE"
              ? "bg-zinc-800 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <ListMusic className="w-3 h-3" />
          <span>Queue ({currentPlaylist?.items?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("MEMBERS")}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "MEMBERS"
              ? "bg-zinc-800 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Users className="w-3 h-3" />
          <span>Users ({room.memberships.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ACTIVITY")}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "ACTIVITY"
              ? "bg-zinc-800 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Activity className="w-3 h-3" />
          <span>Audit</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "CHAT" && (
        <ChatTab
          messages={room.chatMessages}
          currentUserId={currentUserId}
          settings={room.settings}
          isHostOrMod={isHostOrMod}
          onSendMessage={onSendMessage}
        />
      )}

      {activeTab === "QUEUE" && (
        <QueueTab
          playlist={currentPlaylist}
          settings={room.settings}
          isHostOrMod={isHostOrMod}
          canControl={canControl}
          onAddPlaylistItem={onAddPlaylistItem}
          onRemovePlaylistItem={onRemovePlaylistItem}
          onReorderPlaylistItem={onReorderPlaylistItem}
          onPlayQueueItem={onPlayQueueItem}
        />
      )}

      {activeTab === "MEMBERS" && (
        <MembersTab
          memberships={room.memberships}
          currentUserId={currentUserId}
          isHost={isHost}
          onUpdateMemberRole={onUpdateMemberRole}
          onTransferHost={onTransferHost}
          onKickMember={onKickMember}
          onBanMember={onBanMember}
          onUpdateNickname={onUpdateNickname}
        />
      )}

      {activeTab === "ACTIVITY" && <ActivityTab events={room.events} />}
    </div>
  );
}
