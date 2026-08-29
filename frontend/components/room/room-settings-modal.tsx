"use client";

import * as React from "react";
import type { Room, RoomSettings, RoomVisibility } from "@/lib/contract-types";
import { X, Sliders, Shield, MessageSquare, Power, Loader2 } from "lucide-react";
import { PermissionSettings } from "./settings/permission-settings";
import { ChatSettings } from "./settings/chat-settings";
import { LifecycleSettings } from "./settings/lifecycle-settings";

interface RoomSettingsModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRoom: (updates: Partial<Room>) => void;
  onUpdateSettings: (settingsUpdates: Partial<RoomSettings>) => void;
  onDeleteRoom?: () => void;
}

export function RoomSettingsModal({
  room,
  isOpen,
  onClose,
  onUpdateRoom,
  onUpdateSettings,
  onDeleteRoom,
}: RoomSettingsModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = React.useState<
    "GENERAL" | "PERMISSIONS" | "CHAT" | "LIFECYCLE"
  >("GENERAL");

  const [name, setName] = React.useState(room.name);
  const [description, setDescription] = React.useState(room.description || "");
  const [visibility, setVisibility] = React.useState<RoomVisibility>(
    room.visibility
  );
  const [maxMembers, setMaxMembers] = React.useState(room.maxMembers);
  const [settings, setSettings] = React.useState<RoomSettings>(room.settings);
  const [isPending, setIsPending] = React.useState(false);
  const [savedMessage, setSavedMessage] = React.useState(false);
  const [errors, setErrors] = React.useState<{ name?: string }>({});

  React.useEffect(() => {
    setName(room.name);
    setDescription(room.description || "");
    setVisibility(room.visibility);
    setMaxMembers(room.maxMembers);
    setSettings(room.settings);
  }, [room]);

  if (!isOpen) return null;

  const handleUpdateSettingField = (
    key: keyof RoomSettings,
    val: boolean | number
  ) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const validate = (): boolean => {
    const nextErrors: { name?: string } = {};
    if (!name.trim()) {
      nextErrors.name = "Room title is required";
    } else if (name.trim().length < 2) {
      nextErrors.name = "Room title must be at least 2 characters";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    if (!validate()) {
      return;
    }

    setIsPending(true);
    try {
      onUpdateRoom({
        name: name.trim(),
        description: description.trim(),
        visibility,
        maxMembers,
      });
      onUpdateSettings(settings);

      setSavedMessage(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSavedMessage(false);
      onClose();
    } finally {
      setIsPending(false);
    }
  };

  const handleEndRoom = () => {
    if (confirm("Are you sure you want to end and delete this watch room for all viewers?")) {
      if (onDeleteRoom) {
        onDeleteRoom();
      } else {
        onUpdateRoom({ status: "ENDED" });
      }
      onClose();
    }
  };

  const handleArchiveRoom = () => {
    if (confirm("Archive this room and lock playback permanently?")) {
      onUpdateRoom({ status: "ARCHIVED" });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="font-bold text-sm text-zinc-950 dark:text-white">Room Settings</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Manage permissions, chat restrictions, and room lifecycle
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings modal"
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 p-1 bg-zinc-100/80 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <button
            type="button"
            onClick={() => setActiveTab("GENERAL")}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "GENERAL"
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs font-bold"
                : "hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PERMISSIONS")}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "PERMISSIONS"
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs font-bold"
                : "hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Controls
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("CHAT")}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "CHAT"
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs font-bold"
                : "hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LIFECYCLE")}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "LIFECYCLE"
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs font-bold"
                : "hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Power className="w-3.5 h-3.5" /> Lifecycle
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} aria-busy={isPending} className="p-5 overflow-y-auto space-y-4 flex-1">
          {errors.name && (
            <p role="alert" className="text-xs text-red-500 dark:text-red-400 font-medium">
              {errors.name}
            </p>
          )}

          {activeTab === "GENERAL" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="general-room-title" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Room Title
                </label>
                <input
                  id="general-room-title"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={name}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "general-room-title-error" : undefined}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:border-zinc-400 dark:focus:border-zinc-700 outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-600"
                />
                {errors.name && (
                  <p id="general-room-title-error" role="alert" className="text-[11px] text-red-500 dark:text-red-400 font-medium">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="general-room-desc" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Description (Optional)
                </label>
                <textarea
                  id="general-room-desc"
                  name="description"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this party about?"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-700 outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-600 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Visibility</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility("PUBLIC")}
                    className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                      visibility === "PUBLIC"
                        ? "border-zinc-950 dark:border-white bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs font-semibold"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span>Public</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Discoverable</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("UNLISTED")}
                    className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                      visibility === "UNLISTED"
                        ? "border-zinc-950 dark:border-white bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs font-semibold"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span>Unlisted</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Invite link only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("PRIVATE")}
                    className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                      visibility === "PRIVATE"
                        ? "border-zinc-950 dark:border-white bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs font-semibold"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span>Private</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Approval needed</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="general-max-capacity" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Max Capacity ({maxMembers} Viewers)
                </label>
                <input
                  id="general-max-capacity"
                  name="maxMembers"
                  aria-label="Max room viewer capacity"
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className="w-full h-2 min-h-[24px] bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-950 dark:accent-white"
                />
              </div>
            </div>
          )}

          {activeTab === "PERMISSIONS" && (
            <PermissionSettings
              settings={settings}
              onUpdate={handleUpdateSettingField}
            />
          )}

          {activeTab === "CHAT" && (
            <ChatSettings
              settings={settings}
              onUpdate={handleUpdateSettingField}
            />
          )}

          {activeTab === "LIFECYCLE" && (
            <LifecycleSettings
              settings={settings}
              onUpdate={handleUpdateSettingField}
              onEndRoom={handleEndRoom}
              onArchiveRoom={handleArchiveRoom}
            />
          )}

          {/* Footer CTA */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              {savedMessage && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in">
                  ✓ Settings saved successfully!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !name.trim()}
                aria-disabled={isPending || !name.trim()}
                className="px-4 py-1.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{isPending ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
