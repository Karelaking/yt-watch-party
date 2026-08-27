"use client";

import * as React from "react";
import { PillButton } from "@/components/ds/pill-button";
import { PillBadge } from "@/components/ds/pill-badge";
import { YouTubeIcon } from "@/components/ds/brand-icons";
import { Copy, Check, Sparkles, Users, Play, Shield, Radio } from "lucide-react";
import confetti from "canvas-confetti";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function InteractiveDemo(): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [youtubeUrl, setYoutubeUrl] = React.useState("https://www.youtube.com/watch?v=jfKfPfyJRdk");
  const [roomName, setRoomName] = React.useState("Saturday Chill & Vibe");
  const [copied, setCopied] = React.useState(false);
  const [created, setCreated] = React.useState(false);
  const resultRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
          y: 40,
          scale: 0.96,
          rotateX: 6,
          transformPerspective: 1000,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
            once: true,
          },
        }
      );
    },
    { scope: containerRef }
  );

  const sampleVideos = [
    { title: "Lofi Girl - Relax & Study", url: "https://www.youtube.com/watch?v=jfKfPfyJRdk", category: "Music 🎵" },
    { title: "GTA VI Official Trailer 1", url: "https://www.youtube.com/watch?v=QdBZY2fkU-0", category: "Gaming 🎮" },
    { title: "Apple Vision Pro Reveal", url: "https://www.youtube.com/watch?v=TX9qSaGXFyg", category: "Tech ⚡" },
  ];

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setCreated(true);

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#18181b", "#ef4444", "#3b82f6", "#10b981"],
    });

    setTimeout(() => {
      if (resultRef.current) {
        gsap.fromTo(
          resultRef.current,
          { opacity: 0, scale: 0.95, y: 15 },
          { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
        );
      }
    }, 50);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://watchparty.live/r/saturday-chill-vibe-391");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      className="w-full max-w-4xl mx-auto rounded-3xl bg-white border border-zinc-200/90 p-6 sm:p-10 shadow-2xl shadow-zinc-950/5 select-none"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
        <div>
          <PillBadge tag="Instant Demo" subtext="No Signup Required" className="mb-2" />
          <h3 className="text-2xl font-bold tracking-tight text-zinc-900">
            Create a Test Watch Room in 3 Seconds
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            Pick a video or enter a YouTube URL to spin up an instant synced playback room.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-full px-3.5 py-1.5 self-start sm:self-auto">
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Sync Engine: Active</span>
        </div>
      </div>

      {/* Preset Suggestions */}
      <div className="my-6">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2.5">
          Popular Presets
        </span>
        <div className="flex flex-wrap gap-2">
          {sampleVideos.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setYoutubeUrl(sample.url);
                setRoomName(sample.title);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 transition-all hover:scale-102 cursor-pointer"
            >
              <span>{sample.category}</span>
              <span className="font-semibold text-zinc-900">{sample.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleCreateRoom} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <YouTubeIcon className="w-4 h-4 text-red-600" /> YouTube Video URL
            </label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all font-mono"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-zinc-900" /> Party Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Anime Night with the Boys"
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"
              required
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Encrypted WebRTC P2P + WebSocket fallback</span>
          </div>

          <PillButton
            type="submit"
            variant="default"
            pulse={!created}
            icon={<Sparkles className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Launch Instant Room 🚀
          </PillButton>
        </div>
      </form>

      {/* Generated Room Result Card */}
      {created && (
        <div
          ref={resultRef}
          className="mt-6 p-5 rounded-2xl bg-zinc-950 text-white border border-zinc-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Room Created & Synced
              </span>
            </div>
            <div className="font-mono text-sm sm:text-base font-semibold text-zinc-100 truncate">
              https://watchparty.live/r/saturday-chill-vibe-391
            </div>
            <p className="text-xs text-zinc-400">
              Host: <span className="text-white font-medium">You</span> • Video: <span className="text-white font-medium">{roomName}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Invite Link"}</span>
            </button>
            <a
              href="#demo-screen"
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-zinc-950" />
              <span>Enter Room</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
