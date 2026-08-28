/**
 * Multi-provider media utility functions (YouTube, Twitch, Vimeo, Direct URL)
 */

import { MediaProvider, MediaType } from "./contract-types";

export interface ParsedMediaInfo {
  provider: MediaProvider;
  type: MediaType;
  externalId: string;
  sourceUrl: string;
  title: string;
  thumbnailUrl: string;
  duration?: number;
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  const match = cleanUrl.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts|watch)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

export function parseMediaUrl(url: string): ParsedMediaInfo | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // 1. Check YouTube
  const ytId = extractYouTubeId(cleanUrl);
  if (ytId) {
    return {
      provider: "YOUTUBE",
      type: "VIDEO",
      externalId: ytId,
      sourceUrl: cleanUrl,
      title: `YouTube Video (${ytId})`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      duration: 600,
    };
  }

  // 2. Check Twitch
  const twitchMatch = cleanUrl.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
  if (twitchMatch && twitchMatch[1]) {
    const channel = twitchMatch[1];
    return {
      provider: "TWITCH",
      type: "STREAM",
      externalId: channel,
      sourceUrl: cleanUrl,
      title: `Twitch Live: ${channel}`,
      thumbnailUrl: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-440x248.jpg`,
      duration: 0,
    };
  }

  // 3. Check Vimeo
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const vimeoId = vimeoMatch[1];
    return {
      provider: "VIMEO",
      type: "VIDEO",
      externalId: vimeoId,
      sourceUrl: cleanUrl,
      title: `Vimeo Video (${vimeoId})`,
      thumbnailUrl: `https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80`,
      duration: 300,
    };
  }

  // 4. Check Direct Video (MP4 / WebM / HLS)
  if (cleanUrl.match(/\.(mp4|webm|ogg|m3u8)($|\?)/i) || cleanUrl.startsWith("http")) {
    return {
      provider: cleanUrl.includes(".m3u8") ? "HLS" : "DIRECT_URL",
      type: "VIDEO",
      externalId: `direct-${Date.now()}`,
      sourceUrl: cleanUrl,
      title: "Direct Video Stream",
      thumbnailUrl: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=80",
      duration: 600,
    };
  }

  return null;
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function formatSeconds(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "WP-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
