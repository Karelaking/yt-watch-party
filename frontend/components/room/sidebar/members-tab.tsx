"use client";

import * as React from "react";
import type { RoomMembership, RoomRole, BanType } from "@/lib/contract-types";
import { Edit2, Crown, Shield, UserX, Ban } from "lucide-react";

interface MembersTabProps {
  memberships: RoomMembership[];
  currentUserId: string;
  isHost: boolean;
  onUpdateMemberRole: (userId: string, role: RoomRole) => void;
  onTransferHost: (userId: string) => void;
  onKickMember: (userId: string) => void;
  onBanMember: (userId: string, userName: string, reason: string, type: BanType) => void;
  onUpdateNickname: (newNickname: string) => void;
}

export function MembersTab({
  memberships,
  currentUserId,
  isHost,
  onUpdateMemberRole,
  onTransferHost,
  onKickMember,
  onBanMember,
  onUpdateNickname,
}: MembersTabProps): React.JSX.Element {
  const [editingNickname, setEditingNickname] = React.useState(false);
  const [nicknameInput, setNicknameInput] = React.useState("");
  const [banModalUser, setBanModalUser] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [banReason, setBanReason] = React.useState("Disruptive behavior");
  const [banType, setBanType] = React.useState<BanType>("USER");

  const currentMembership = memberships.find(
    (m) =>
      m.userId === currentUserId ||
      (m.user as any)?.clerkUserId === currentUserId ||
      (m.user as any)?.id === currentUserId
  );

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) return;
    onUpdateNickname(nicknameInput.trim());
    setEditingNickname(false);
  };

  const handleConfirmBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banModalUser) return;
    onBanMember(banModalUser.id, banModalUser.name, banReason, banType);
    setBanModalUser(null);
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden">
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {/* Nickname Editor for Self */}
        <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 font-medium">
              Nickname: <strong className="text-zinc-200 font-semibold">{currentMembership?.nickname || currentMembership?.user.displayName || "Default"}</strong>
            </span>
            {!editingNickname ? (
              <button
                onClick={() => {
                  setNicknameInput(currentMembership?.nickname || "");
                  setEditingNickname(true);
                }}
                className="text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            ) : null}
          </div>

          {editingNickname ? (
            <form onSubmit={handleSaveNickname} className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Enter nickname..."
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                autoFocus
                maxLength={50}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-white text-zinc-950 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingNickname(false)}
                className="px-2 py-1 text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : null}
        </div>

        {/* Members List */}
        <div className="space-y-1.5">
          {memberships.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {m.user.displayName?.[0] || "U"}
                </div>
                <div className="truncate">
                  <span className="font-medium text-zinc-200 truncate block">
                    {m.nickname || m.user.displayName || "Watcher"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {m.role === "HOST" ? (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Host
                  </span>
                ) : m.role === "MODERATOR" ? (
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Mod
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                    Viewer
                  </span>
                )}

                {/* Moderation Dropdown / Actions */}
                {isHost && m.role !== "HOST" && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const targetId = m.userId || (m.user as any)?.id || (m.user as any)?.clerkUserId;
                        onUpdateMemberRole(
                          targetId,
                          m.role === "MODERATOR" ? "PARTICIPANT" : "MODERATOR"
                        );
                      }}
                      className="text-[10px] text-zinc-400 hover:text-white px-1 py-0.5 rounded hover:bg-zinc-800 cursor-pointer"
                      title="Toggle Moderator Role"
                    >
                      {m.role === "MODERATOR" ? "Demote" : "Mod"}
                    </button>

                    <button
                      onClick={() => {
                        const targetId = m.userId || (m.user as any)?.id || (m.user as any)?.clerkUserId;
                        onTransferHost(targetId);
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 px-1 py-0.5 rounded hover:bg-zinc-800 cursor-pointer"
                      title="Transfer Room Ownership"
                    >
                      Host
                    </button>

                    <button
                      onClick={() => {
                        const targetId = m.userId || (m.user as any)?.id || (m.user as any)?.clerkUserId;
                        onKickMember(targetId);
                      }}
                      className="p-1 text-zinc-400 hover:text-red-400 cursor-pointer"
                      title="Kick Member"
                    >
                      <UserX className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => {
                        const targetId = m.userId || (m.user as any)?.id || (m.user as any)?.clerkUserId;
                        setBanModalUser({
                          id: targetId,
                          name: m.nickname || m.user.displayName || "User",
                        });
                      }}
                      className="p-1 text-zinc-400 hover:text-red-500 cursor-pointer"
                      title="Ban Member"
                    >
                      <Ban className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ban Confirmation Dialog */}
      {banModalUser && (
        <div className="p-3 bg-red-950/40 border-t border-red-900/60 space-y-2 text-xs">
          <span className="font-bold text-red-400 block">
            Ban {banModalUser.name}?
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Reason for ban..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white"
            />
            <select
              value={banType}
              onChange={(e) => setBanType(e.target.value as BanType)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white"
            >
              <option value="USER">User Ban</option>
              <option value="IP">IP Ban</option>
              <option value="DEVICE">Device Ban</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setBanModalUser(null)}
              className="px-2 py-1 text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmBan}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg cursor-pointer"
            >
              Confirm Ban
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
