"use client";

import * as React from "react";
import { formatSeconds } from "@/lib/youtube-utils";
import { PLAYBACK_RATES } from "@/lib/constants";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  Minimize2,
  Lock,
} from "lucide-react";

interface PlayerControlsBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  canControl: boolean;
  showControls: boolean;
  showSpeedMenu: boolean;
  hoverScrubTime: number | null;
  onTogglePlay: () => void;
  onSkip: (delta: number) => void;
  onSeek: (position: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onRateChange: (rate: number) => void;
  onToggleSpeedMenu: () => void;
  onToggleFullscreen: () => void;
  onScrubberMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onScrubberMouseLeave: () => void;
  onScrubberClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function PlayerControlsBar({
  isPlaying,
  currentTime,
  duration,
  bufferedPercent,
  volume,
  isMuted,
  playbackRate,
  isFullscreen,
  canControl,
  showControls,
  showSpeedMenu,
  hoverScrubTime,
  onTogglePlay,
  onSkip,
  onVolumeChange,
  onToggleMute,
  onRateChange,
  onToggleSpeedMenu,
  onToggleFullscreen,
  onScrubberMouseMove,
  onScrubberMouseLeave,
  onScrubberClick,
}: PlayerControlsBarProps): React.JSX.Element {
  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end p-3 bg-gradient-to-t from-zinc-950/95 via-zinc-950/70 to-transparent transition-opacity duration-300 ${
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Scrubber Progress Bar — Interactive only for Host/Authorized Controllers */}
      {canControl ? (
        <div className="relative group/scrub py-2 cursor-pointer">
          {/* Scrubber Tooltip */}
          {hoverScrubTime !== null && (
            <div
              style={{
                left: `${(hoverScrubTime / (duration || 1)) * 100}%`,
              }}
              className="absolute -top-7 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-lg border border-zinc-700 pointer-events-none z-40 whitespace-nowrap"
            >
              {formatSeconds(hoverScrubTime)}
            </div>
          )}

          <div
            onClick={onScrubberClick}
            onMouseMove={onScrubberMouseMove}
            onMouseLeave={onScrubberMouseLeave}
            className="relative h-1.5 hover:h-2.5 w-full bg-zinc-800/90 rounded-full overflow-hidden transition-all"
          >
            {/* Buffered track */}
            <div
              style={{ width: `${bufferedPercent}%` }}
              className="absolute left-0 top-0 bottom-0 bg-zinc-700/80 rounded-full transition-all duration-300"
            />
            {/* Played track */}
            <div
              style={{ width: `${progressPercent}%` }}
              className="absolute left-0 top-0 bottom-0 bg-white rounded-full transition-all duration-75"
            />
          </div>
        </div>
      ) : (
        /* Non-interactive progress indicator for viewers */
        <div className="py-2">
          <div className="relative h-1 w-full bg-zinc-800/60 rounded-full overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="absolute left-0 top-0 bottom-0 bg-red-500/80 rounded-full transition-all duration-75"
            />
          </div>
        </div>
      )}

      {/* Control Buttons Strip */}
      <div className="flex items-center justify-between pt-1 text-zinc-300 select-none">
        {/* Left Side: Play, Skip (Host Only) + Volume, Timecode (All) */}
        <div className="flex items-center gap-3 text-xs">
          {/* Media Playback Controls — Rendered only for Host / Authorized controllers */}
          {canControl && (
            <>
              {/* Play/Pause Button */}
              <button
                type="button"
                onClick={onTogglePlay}
                className="p-1.5 text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white" />
                )}
              </button>

              {/* Skip -10s */}
              <button
                type="button"
                onClick={() => onSkip(-10)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Rewind 10s (J)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Skip +10s */}
              <button
                type="button"
                onClick={() => onSkip(10)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Fast forward 10s (L)"
              >
                <FastForward className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Volume Control (Available for all viewers locally) */}
          <div className="flex items-center gap-1.5 group/vol">
            <button
              type="button"
              onClick={onToggleMute}
              className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title={isMuted ? "Unmute (M)" : "Mute (M)"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : volume < 50 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          {/* Time Display */}
          <div className="font-mono text-[11px] text-zinc-400">
            <span className="text-zinc-200 font-semibold">
              {formatSeconds(currentTime)}
            </span>{" "}
            / {formatSeconds(duration)}
          </div>
        </div>

        {/* Right Side: Speed Menu (Host), Permissions Badge, Fullscreen (All) */}
        <div className="flex items-center gap-2">
          {!canControl && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 text-[10px] border border-zinc-800">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Host Control Only</span>
            </div>
          )}

          {/* Playback Speed Switcher — Host Only */}
          {canControl && (
            <div className="relative">
              <button
                type="button"
                onClick={onToggleSpeedMenu}
                className="px-2 py-1 text-xs font-mono font-bold bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-9 right-0 bg-zinc-900 border border-zinc-800 rounded-xl p-1 shadow-2xl z-50 flex flex-col gap-0.5 min-w-[70px]">
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => onRateChange(rate)}
                      className={`px-2.5 py-1 text-xs font-mono rounded-lg text-left transition-colors cursor-pointer ${
                        playbackRate === rate
                          ? "bg-white text-zinc-950 font-bold"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer text-zinc-300 hover:text-white"
            title="Fullscreen (F)"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
