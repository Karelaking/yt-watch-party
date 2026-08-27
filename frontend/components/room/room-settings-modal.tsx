"use client";

import * as React from "react";
import type { Room, RoomSettings, RoomVisibility } from "@/lib/contract-types";
import { X, Sliders, Shield, MessageSquare, Power } from "lucide-react";
import { GeneralSettings } from "./settings/general-settings";
import { PermissionSettings } from "./settings/permission-settings";
import { ChatSettings } from "./settings/chat-settings";
import { LifecycleSettings } from "./settings/lifecycle-settings";

interface RoomSettingsModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRoom: (updates: Partial<Room>) => void;
  onUpdateSettings: (settingsUpdates: Partial<RoomSettings>) => void;
}

export function RoomSettingsModal({
  room,
  isOpen,
  onClose,
  onUpdateRoom,
  onUpdateSettings,
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
  const [savedMessage, setSavedMessage] = React.useState(false);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRoom({
      name,
      description,
      visibility,
      maxMembers,
    });
    onUpdateSettings(settings);

    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
    }, 800);
  };

  const handleEndRoom = () => {
    if (confirm("Are you sure you want to end this watch room for all viewers?")) {
      onUpdateRoom({ status: "ENDED" });
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-sm text-white">Room Settings</h2>
            <p className="text-xs text-zinc-400">
              Manage permissions, chat restrictions, and room lifecycle
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 p-1 bg-zinc-950/60 border-b border-zinc-800 text-xs font-semibold text-zinc-400">
          <button
            type="button"
            onClick={() => setActiveTab("GENERAL")}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "GENERAL" ? "bg-zinc-800 text-white" : "hover:text-zinc-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PERMISSIONS")}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "PERMISSIONS" ? "bg-zinc-800 text-white" : "hover:text-zinc-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Controls
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("CHAT")}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "CHAT" ? "bg-zinc-800 text-white" : "hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LIFECYCLE")}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "LIFECYCLE" ? "bg-zinc-800 text-white" : "hover:text-zinc-200"
            }`}
          >
            <Power className="w-3.5 h-3.5" /> Lifecycle
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === "GENERAL" && (
            <GeneralSettings
              name={name}
              description={description}
              visibility={visibility}
              maxMembers={maxMembers}
              onNameChange={setName}
              onDescriptionChange={setDescription}
              onVisibilityChange={setVisibility}
              onMaxMembersChange={setMaxMembers}
            />
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
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <div>
              {savedMessage && (
                <span className="text-xs text-emerald-400 font-semibold animate-in fade-in">
                  ✓ Settings saved successfully!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
