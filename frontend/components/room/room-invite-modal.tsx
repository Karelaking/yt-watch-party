"use client";

import * as React from "react";
import { Room, RoomInvitation } from "@/lib/contract-types";
import { createRoomInvitation } from "@/lib/room-store";
import {
  X,
  Share2,
  Copy,
  Check,
  Mail,
  Send,
  Loader2,
} from "lucide-react";

interface RoomInviteModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
}

function RoomInviteForm({
  room,
  onClose,
  currentUserId,
  currentUserName,
}: {
  room: Room;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
}): React.JSX.Element {
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [expiresHours, setExpiresHours] = React.useState(24);
  const [inviteList, setInviteList] = React.useState<RoomInvitation[]>(room.invitations || []);
  const [sentSuccess, setSentSuccess] = React.useState(false);

  const roomUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${room.id}`
      : `https://watchparty.live/room/${room.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    setIsPending(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const newInv = createRoomInvitation(
        room.id,
        currentUserId,
        currentUserName,
        email.trim() || undefined,
        expiresHours
      );
      setInviteList((prev) => [newInv, ...prev]);
      setEmail("");
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 2000);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold tracking-tight">Invite to Watch Party</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invite modal"
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Quick Copy Link & Code */}
          <div className="space-y-2">
            <label className="font-semibold text-zinc-300 block">
              Direct Room Link & Code
            </label>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 font-mono truncate text-[11px]">
                {roomUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className="bg-white hover:bg-zinc-200 text-zinc-950 font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copied" : "Copy Link"}</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400">Room Quick Code:</span>
              <button
                onClick={handleCopyCode}
                className="font-mono font-bold text-white hover:text-emerald-400 flex items-center gap-1.5 cursor-pointer"
              >
                <span>{room.code}</span>
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Create Custom Token / Email Invite */}
          <form onSubmit={handleCreateInvitation} aria-busy={isPending} className="space-y-3 pt-3 border-t border-zinc-800">
            <label
              htmlFor="invite-email-input"
              className="font-semibold text-zinc-300 flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <span>Generate Invitation Token / Email Invite</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                id="invite-email-input"
                type="email"
                autoComplete="email"
                placeholder="friend@email.com (optional)"
                value={email}
                disabled={isPending}
                onChange={(e) => setEmail(e.target.value)}
                className="sm:col-span-8 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:opacity-60"
              />

              <select
                aria-label="Invitation expiration duration"
                value={expiresHours}
                disabled={isPending}
                onChange={(e) => setExpiresHours(Number(e.target.value))}
                className="sm:col-span-4 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-white outline-none focus:border-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:opacity-60"
              >
                <option value={1}>Expires in 1h</option>
                <option value={24}>Expires in 24h</option>
                <option value={168}>Expires in 7d</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isPending}
              aria-disabled={isPending}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>
                {isPending
                  ? "Generating Invite..."
                  : email
                  ? "Send Email Invitation"
                  : "Create Expiring Invite Link"}
              </span>
            </button>

            {sentSuccess && (
              <p
                role="status"
                aria-live="polite"
                className="text-emerald-400 text-center font-medium"
              >
                Invitation created successfully!
              </p>
            )}
          </form>

          {/* Active Invitations List */}
          {inviteList.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-zinc-800">
              <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px] block">
                Active Invitations ({inviteList.length})
              </span>

              <div className="max-h-32 overflow-y-auto space-y-1.5">
                {inviteList.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px]"
                  >
                    <div className="truncate flex-1">
                      <span className="font-semibold text-zinc-200 block truncate">
                        {inv.inviteeEmail || "Expiring Web Token"}
                      </span>
                      <span className="text-zinc-500 text-[10px]">
                        Expires {new Date(inv.expiresAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px] font-semibold">
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RoomInviteModal({
  room,
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
}: RoomInviteModalProps): React.JSX.Element | null {
  if (!isOpen) return null;
  return (
    <RoomInviteForm
      room={room}
      onClose={onClose}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
    />
  );
}
