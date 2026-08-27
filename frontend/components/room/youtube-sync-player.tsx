"use client";

import * as React from "react";
import type { Media, PlaybackState, RoomSettings } from "@/lib/contract-types";
import { loadYouTubeIframeAPI, YouTubePlayerInstance, YouTubePlayerEvent } from "@/lib/youtube-iframe-loader";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Play } from "lucide-react";
import { PlayerHeaderBar } from "./player-header-bar";
import { PlayerControlsBar } from "./player-controls-bar";

export interface FloatingParticle {
  id: string;
  emoji: string;
  left: number;
}

export interface YouTubeSyncPlayerProps {
  currentMedia: Media | null;
  playbackState: PlaybackState;
  settings: RoomSettings;
  isHost: boolean;
  isHostOrMod: boolean;
  isScreenSharing?: boolean;
  screenStream: MediaStream | null;
  onPlaybackChange: (
    isPlaying: boolean,
    position: number,
    rate: number,
    action?: "PLAY" | "PAUSE" | "SEEK" | "CHANGE_RATE"
  ) => void;
  onChangeVideo: (newUrl: string) => void;
  onAutoplayNext?: () => void;
  floatingReactions: FloatingParticle[];
}

export function getExpectedPosition(state: PlaybackState): number {
  if (!state.isPlaying) {
    return Math.max(0, state.position || 0);
  }
  const serverTime = state.serverTimestamp ? new Date(state.serverTimestamp).getTime() : Date.now();
  const now = Date.now();
  const elapsed = Math.max(0, (now - serverTime) / 1000);
  return Math.max(0, (state.position || 0) + elapsed * (state.playbackRate || 1.0));
}

const FloatingReactionsOverlay = React.memo(function FloatingReactionsOverlay({
  reactions,
}: {
  reactions: FloatingParticle[];
}): React.JSX.Element | null {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {reactions.map((p) => (
        <div
          key={p.id}
          style={{ left: `${p.left}%` }}
          className="absolute bottom-6 text-3xl animate-reaction-1"
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
});

export function YouTubeSyncPlayer({
  currentMedia,
  playbackState,
  settings,
  isHost,
  isHostOrMod,
  screenStream,
  onPlaybackChange,
  onChangeVideo,
  onAutoplayNext,
  floatingReactions,
}: YouTubeSyncPlayerProps): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<YouTubePlayerInstance | null>(null);
  const screenVideoRef = React.useRef<HTMLVideoElement>(null);
  const directVideoRef = React.useRef<HTMLVideoElement>(null);
  const iframeContainerId = React.useId().replace(/:/g, "_");

  const [isPlayerReady, setIsPlayerReady] = React.useState(false);
  const [needsInteraction, setNeedsInteraction] = React.useState(false);
  const [localTime, setLocalTime] = React.useState(() => getExpectedPosition(playbackState));
  const [duration, setDuration] = React.useState(currentMedia?.duration || 600);
  const [bufferedPercent, setBufferedPercent] = React.useState(0);
  const [volume, setVolume] = React.useState(80);
  const [isMuted, setIsMuted] = React.useState(false);
  const [playbackRate, setPlaybackRate] = React.useState(playbackState.playbackRate || 1.0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [newVideoUrl, setNewVideoUrl] = React.useState("");
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"MEDIA" | "SCREEN">("MEDIA");
  const [hoverScrubTime, setHoverScrubTime] = React.useState<number | null>(null);
  const [showControls, setShowControls] = React.useState(true);

  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastMouseMoveRef = React.useRef(0);
  const scrubberRectRef = React.useRef<DOMRect | null>(null);
  const isProgrammaticUpdateRef = React.useRef(false);
  const isScrubbingRef = React.useRef(false);

  const isPlaying = playbackState.isPlaying;
  const provider = currentMedia?.provider || "YOUTUBE";
  const externalId = currentMedia?.externalId || "jfKfPfyJRdk";
  const canControl = (() => {
    // HOST always has absolute control (mirrors backend RBAC)
    if (isHost) return true;
    // Open DJ mode: everyone can control
    if (!settings.onlyHostCanControlPlayback) return true;
    // Host-only mode: moderator needs explicit permission, others denied
    if (isHostOrMod) {
      return settings.allowModeratorPlaybackControl !== false;
    }
    return false;
  })();

  // Refs for stable callbacks
  const playbackStateRef = React.useRef(playbackState);
  const settingsRef = React.useRef(settings);
  const canControlRef = React.useRef(canControl);
  const volumeRef = React.useRef(volume);
  const isMutedRef = React.useRef(isMuted);
  const playbackRateRef = React.useRef(playbackRate);
  const localTimeRef = React.useRef(localTime);
  const durationRef = React.useRef(duration);
  const callbacksRef = React.useRef({
    onPlaybackChange,
    onChangeVideo,
    onAutoplayNext,
  });

  React.useEffect(() => {
    playbackStateRef.current = playbackState;
    settingsRef.current = settings;
    canControlRef.current = canControl;
    volumeRef.current = volume;
    isMutedRef.current = isMuted;
    playbackRateRef.current = playbackRate;
    localTimeRef.current = localTime;
    durationRef.current = duration;
    callbacksRef.current = {
      onPlaybackChange,
      onChangeVideo,
      onAutoplayNext,
    };
  });

  // Controls fade timeout
  const handleMouseMove = React.useCallback(() => {
    const now = Date.now();
    if (now - lastMouseMoveRef.current < 200) return;
    lastMouseMoveRef.current = now;

    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      setShowSpeedMenu(false);
    }, 3500);
  }, []);

  React.useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Initialize YouTube Iframe Player
  const initialExternalIdRef = React.useRef(externalId);
  React.useEffect(() => {
    if (provider !== "YOUTUBE") return;
    let isMounted = true;

    loadYouTubeIframeAPI().then(() => {
      if (!isMounted) return;
      if (playerRef.current) return;

      const containerId = `yt-player-${iframeContainerId}`;
      const el = document.getElementById(containerId);
      if (!el || !window.YT || !window.YT.Player) return;

      try {
        playerRef.current = new window.YT.Player(containerId, {
          width: "100%",
          height: "100%",
          videoId: initialExternalIdRef.current,
          playerVars: {
            autoplay: playbackStateRef.current.isPlaying ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            enablejsapi: 1,
            playsinline: 1,
            origin: typeof window !== "undefined" ? window.location.origin : "",
          },
          events: {
            onReady: (event: YouTubePlayerEvent) => {
              if (!isMounted) return;
              setIsPlayerReady(true);
              const dur = event.target.getDuration();
              if (dur && dur > 0) setDuration(dur);
              event.target.setVolume(volumeRef.current);
              if (isMutedRef.current) event.target.mute();
              event.target.setPlaybackRate(playbackRateRef.current);

              const initialExpectedPos = getExpectedPosition(playbackStateRef.current);
              if (initialExpectedPos > 0) {
                event.target.seekTo(initialExpectedPos, true);
                setLocalTime(initialExpectedPos);
              }
              if (playbackStateRef.current.isPlaying) {
                try {
                  event.target.playVideo();
                } catch {}
                // Fallback muted autoplay if browser blocks sound
                setTimeout(() => {
                  if (isMounted && playerRef.current) {
                    try {
                      const state = playerRef.current.getPlayerState();
                      if (playbackStateRef.current.isPlaying && state !== 1 && state !== 3) {
                        playerRef.current.mute();
                        playerRef.current.playVideo();
                        setIsMuted(true);
                        setNeedsInteraction(true);
                      }
                    } catch {}
                  }
                }, 800);
              }
            },
            onStateChange: (event: YouTubePlayerEvent) => {
              if (!isMounted) return;
              const currentSettings = settingsRef.current;
              const canControl = canControlRef.current;
              const cb = callbacksRef.current;

              // Video finished -> trigger autoplay if enabled
              if (event.data === 0) {
                if (currentSettings.autoplayNext && cb.onAutoplayNext && canControl) {
                  cb.onAutoplayNext();
                }
                return;
              }

              if (event.data === 1) { // PLAYING
                setNeedsInteraction(false);
                const curr = typeof event.target.getCurrentTime === "function" ? event.target.getCurrentTime() : undefined;
                if (curr !== undefined) {
                  setLocalTime((prev) => (Math.abs(prev - curr) > 0.3 ? curr : prev));
                }
              } else if (event.data === 2) { // PAUSED
                const curr = typeof event.target.getCurrentTime === "function" ? event.target.getCurrentTime() : undefined;
                if (curr !== undefined) {
                  setLocalTime((prev) => (Math.abs(prev - curr) > 0.3 ? curr : prev));
                }
              }
            },
          },
        });
      } catch {
        // Player creation error
      }
    });

    return () => {
      isMounted = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
        setIsPlayerReady(false);
      }
    };
  }, [provider, iframeContainerId]);

  // Video ID change (smoothly load next/changed video in existing player)
  const prevExternalIdRef = React.useRef(externalId);
  React.useEffect(() => {
    if (prevExternalIdRef.current !== externalId) {
      prevExternalIdRef.current = externalId;
      setDuration(currentMedia?.duration || 600);
      if (playerRef.current && isPlayerReady) {
        try {
          isProgrammaticUpdateRef.current = true;
          const targetPos = getExpectedPosition(playbackState);
          if (typeof playerRef.current.loadVideoById === "function") {
            playerRef.current.loadVideoById(externalId, targetPos || 0);
            setLocalTime(targetPos || 0);
            if (playbackState.isPlaying) {
              try {
                playerRef.current.playVideo();
              } catch {}
              setTimeout(() => {
                if (playerRef.current) {
                  try {
                    const state = playerRef.current.getPlayerState();
                    if (playbackStateRef.current.isPlaying && state !== 1 && state !== 3) {
                      playerRef.current.mute();
                      playerRef.current.playVideo();
                      setIsMuted(true);
                      setNeedsInteraction(true);
                    }
                  } catch {}
                }
              }, 800);
            } else {
              playerRef.current.pauseVideo();
            }
          }
        } catch {
          // ignore
        } finally {
          setTimeout(() => {
            isProgrammaticUpdateRef.current = false;
          }, 800);
        }
      }
    }
  }, [externalId, isPlayerReady, playbackState, currentMedia?.duration]);

  // Screen share stream hookup
  React.useEffect(() => {
    if (screenStream && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  const activeView = screenStream && viewMode === "SCREEN" ? "SCREEN" : "MEDIA";

  // Playback sync from state (authoritative sync handling)
  React.useEffect(() => {
    if (playerRef.current && isPlayerReady) {
      try {
        isProgrammaticUpdateRef.current = true;
        const playerState = playerRef.current.getPlayerState();
        const targetPos = getExpectedPosition(playbackState);

        // 1. Sync position:
        // If the action was an explicit SEEK, or if the user is paused and position drifted,
        // or if playing and drift > 0.8s, seek immediately
        const ytPos = typeof playerRef.current.getCurrentTime === "function" ? playerRef.current.getCurrentTime() : localTimeRef.current;
        const isSeekAction = playbackState.lastAction === "SEEK";
        const isPausedSeek = !playbackState.isPlaying && Math.abs(ytPos - targetPos) > 0.2;
        const isPlayingDrift = playbackState.isPlaying && Math.abs(ytPos - targetPos) > 0.8;

        if (isSeekAction || isPausedSeek || isPlayingDrift) {
          playerRef.current.seekTo(targetPos, true);
          setLocalTime(targetPos);
        }

        // 2. Sync play/pause state
        if (playbackState.isPlaying) {
          // If room is playing, ensure YouTube player plays (even right after a seekTo)
          try {
            playerRef.current.playVideo();
          } catch {}

          // Fallback check if browser autoplay policy blocked audio
          setTimeout(() => {
            if (playerRef.current) {
              try {
                const state = playerRef.current.getPlayerState();
                if (playbackStateRef.current.isPlaying && state !== 1 && state !== 3) {
                  playerRef.current.mute();
                  playerRef.current.playVideo();
                  setIsMuted(true);
                  setNeedsInteraction(true);
                }
              } catch {}
            }
          }, 600);
        } else {
          // Room is paused
          if (playerState === 1 || playerState === 3) {
            try {
              playerRef.current.pauseVideo();
            } catch {}
          }
        }

        // 3. Sync playback rate
        const currentRate = typeof playerRef.current.getPlaybackRate === "function" ? playerRef.current.getPlaybackRate() : 1.0;
        if (playbackState.playbackRate && Math.abs(currentRate - playbackState.playbackRate) > 0.05) {
          playerRef.current.setPlaybackRate(playbackState.playbackRate);
          setPlaybackRate(playbackState.playbackRate);
        }
      } catch {
        // ignore
      } finally {
        setTimeout(() => {
          isProgrammaticUpdateRef.current = false;
        }, 500);
      }
    }

    if (directVideoRef.current && (provider === "DIRECT_URL" || provider === "HLS")) {
      const targetPos = getExpectedPosition(playbackState);
      if (Math.abs(directVideoRef.current.currentTime - targetPos) > 1.0 || playbackState.lastAction === "SEEK") {
        directVideoRef.current.currentTime = targetPos;
      }
      if (playbackState.isPlaying) {
        if (directVideoRef.current.paused) {
          directVideoRef.current.play().catch(() => {});
        }
      } else {
        if (!directVideoRef.current.paused) {
          directVideoRef.current.pause();
        }
      }
      if (playbackState.playbackRate) {
        directVideoRef.current.playbackRate = playbackState.playbackRate;
        setPlaybackRate(playbackState.playbackRate);
      }
    }
  }, [
    playbackState.isPlaying,
    playbackState.position,
    playbackState.playbackRate,
    playbackState.serverTimestamp,
    playbackState.version,
    playbackState.lastAction,
    isPlayerReady,
    provider,
  ]);

  // Volume & rate sync
  React.useEffect(() => {
    if (playerRef.current && isPlayerReady) {
      try {
        if (isMuted) playerRef.current.mute();
        else {
          playerRef.current.unMute();
          playerRef.current.setVolume(volume);
        }
      } catch {}
    }
    if (directVideoRef.current && provider === "DIRECT_URL") {
      directVideoRef.current.muted = isMuted;
      directVideoRef.current.volume = volume / 100;
    }
  }, [volume, isMuted, isPlayerReady, provider]);

  React.useEffect(() => {
    if (playerRef.current && isPlayerReady) {
      try {
        playerRef.current.setPlaybackRate(playbackRate);
      } catch {}
    }
    if (directVideoRef.current && provider === "DIRECT_URL") {
      directVideoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, isPlayerReady, provider]);

  // Polling ticker for UI position and continuous drift correction
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isPlayerReady) {
        try {
          const curr = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          const loaded = playerRef.current.getVideoLoadedFraction();
          const playerState = playerRef.current.getPlayerState();

          if (curr !== undefined) {
            setLocalTime((prev) => (Math.abs(prev - curr) > 0.15 ? curr : prev));
          }
          if (dur && dur > 0) {
            setDuration((prev) => (Math.abs(prev - dur) > 0.5 ? dur : prev));
          }
          if (loaded !== undefined) {
            const loadedPct = Math.round(loaded * 100);
            setBufferedPercent((prev) => (Math.abs(prev - loadedPct) > 1 ? loadedPct : prev));
          }

          // Active background drift correction while playing
          const currentState = playbackStateRef.current;
          if (
            currentState.isPlaying &&
            playerState === 1 && // player is currently playing
            !isProgrammaticUpdateRef.current &&
            !isScrubbingRef.current
          ) {
            const expectedPos = getExpectedPosition(currentState);
            const drift = Math.abs(curr - expectedPos);
            // If participant drifted > 1.2s behind or ahead (e.g. from buffer or tab pause), resync
            if (drift > 1.2) {
              isProgrammaticUpdateRef.current = true;
              playerRef.current.seekTo(expectedPos, true);
              playerRef.current.playVideo();
              setLocalTime(expectedPos);
              setTimeout(() => {
                isProgrammaticUpdateRef.current = false;
              }, 800);
            }
          }
        } catch {}
      } else if (isPlaying) {
        setLocalTime((prev) => {
          const maxDur = durationRef.current;
          const next = prev + 0.5 * playbackRateRef.current;
          return next >= maxDur ? maxDur : next;
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlayerReady, isPlaying]);

  // Fullscreen sync
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleInteractiveSync = React.useCallback(() => {
    setNeedsInteraction(false);
    if (playerRef.current && isPlayerReady) {
      try {
        isProgrammaticUpdateRef.current = true;
        const targetPos = getExpectedPosition(playbackStateRef.current);
        if (isMutedRef.current) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
          playerRef.current.setVolume(volumeRef.current);
        }
        playerRef.current.seekTo(targetPos, true);
        playerRef.current.playVideo();
        setLocalTime(targetPos);
      } catch {}
      setTimeout(() => {
        isProgrammaticUpdateRef.current = false;
      }, 500);
    }
  }, [isPlayerReady]);

  const handleTogglePlay = React.useCallback(() => {
    // If the user cannot control room playback, clicking play/pause triggers local interactive sync
    if (!canControlRef.current) {
      if (playbackStateRef.current.isPlaying) {
        handleInteractiveSync();
      }
      return;
    }

    const next = !playbackStateRef.current.isPlaying;
    const curPos = localTimeRef.current;
    const rate = playbackRateRef.current;

    if (playerRef.current && isPlayerReady) {
      try {
        isProgrammaticUpdateRef.current = true;
        if (next) {
          playerRef.current.seekTo(curPos, true);
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      } catch {}
      setTimeout(() => {
        isProgrammaticUpdateRef.current = false;
      }, 500);
    }

    if (directVideoRef.current && (provider === "DIRECT_URL" || provider === "HLS")) {
      if (next) {
        directVideoRef.current.currentTime = curPos;
        directVideoRef.current.play().catch(() => {});
      } else {
        directVideoRef.current.pause();
      }
    }

    callbacksRef.current.onPlaybackChange(next, curPos, rate, next ? "PLAY" : "PAUSE");
  }, [isPlayerReady, provider, handleInteractiveSync]);

  const handleSeek = React.useCallback(
    (newPos: number) => {
      if (!canControlRef.current) return;
      const maxDur = durationRef.current;
      const clampedPos = Math.max(0, Math.min(maxDur, newPos));
      setLocalTime(clampedPos);
      const isCurrentlyPlaying = playbackStateRef.current.isPlaying;

      if (playerRef.current && isPlayerReady) {
        try {
          isProgrammaticUpdateRef.current = true;
          playerRef.current.seekTo(clampedPos, true);
          if (isCurrentlyPlaying) {
            playerRef.current.playVideo();
          }
        } catch {}
        setTimeout(() => {
          isProgrammaticUpdateRef.current = false;
        }, 500);
      }

      if (directVideoRef.current && (provider === "DIRECT_URL" || provider === "HLS")) {
        directVideoRef.current.currentTime = clampedPos;
        if (isCurrentlyPlaying) {
          directVideoRef.current.play().catch(() => {});
        }
      }

      callbacksRef.current.onPlaybackChange(
        isCurrentlyPlaying,
        clampedPos,
        playbackRateRef.current,
        "SEEK"
      );
    },
    [isPlayerReady, provider]
  );

  const handleSkip = React.useCallback(
    (delta: number) => {
      if (!canControlRef.current) return;
      const cur = localTimeRef.current;
      const maxDur = durationRef.current;
      const newPos = Math.max(0, Math.min(maxDur, cur + delta));
      handleSeek(newPos);
    },
    [handleSeek]
  );

  const handleRateChange = React.useCallback(
    (rate: number) => {
      if (!canControlRef.current) return;
      setPlaybackRate(rate);
      setShowSpeedMenu(false);

      if (playerRef.current && isPlayerReady) {
        try {
          isProgrammaticUpdateRef.current = true;
          playerRef.current.setPlaybackRate(rate);
        } catch {}
        setTimeout(() => {
          isProgrammaticUpdateRef.current = false;
        }, 500);
      }

      if (directVideoRef.current && (provider === "DIRECT_URL" || provider === "HLS")) {
        directVideoRef.current.playbackRate = rate;
      }

      callbacksRef.current.onPlaybackChange(
        playbackStateRef.current.isPlaying,
        localTimeRef.current,
        rate,
        "CHANGE_RATE"
      );
    },
    [isPlayerReady, provider]
  );

  const handleVolumeChange = React.useCallback(
    (newVol: number) => {
      setVolume(newVol);
      if (newVol > 0 && isMutedRef.current) setIsMuted(false);

      if (playerRef.current && isPlayerReady) {
        try {
          playerRef.current.unMute();
          playerRef.current.setVolume(newVol);
        } catch {}
      }

      if (directVideoRef.current && provider === "DIRECT_URL") {
        directVideoRef.current.muted = false;
        directVideoRef.current.volume = newVol / 100;
      }
    },
    [isPlayerReady, provider]
  );

  const handleToggleMute = React.useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (playerRef.current && isPlayerReady) {
        try {
          if (next) playerRef.current.mute();
          else {
            playerRef.current.unMute();
            playerRef.current.setVolume(volumeRef.current);
          }
        } catch {}
      }

      if (directVideoRef.current && provider === "DIRECT_URL") {
        directVideoRef.current.muted = next;
      }
      return next;
    });
  }, [isPlayerReady, provider]);

  const toggleFullscreen = React.useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useKeyboardShortcuts({
    onTogglePlay: handleTogglePlay,
    onSkipBackward: () => handleSkip(-10),
    onSkipForward: () => handleSkip(10),
    onToggleMute: handleToggleMute,
    onToggleFullscreen: toggleFullscreen,
  });

  const handleUrlSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = newVideoUrl.trim();
      if (!trimmed) return;
      callbacksRef.current.onChangeVideo(trimmed);
      setNewVideoUrl("");
      setShowUrlInput(false);
    },
    [newVideoUrl]
  );

  const handleScrubberMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      let rect = scrubberRectRef.current;
      if (!rect) {
        rect = e.currentTarget.getBoundingClientRect();
        scrubberRectRef.current = rect;
      }
      const hoverFraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverScrubTime(hoverFraction * durationRef.current);
    },
    []
  );

  const handleScrubberMouseLeave = React.useCallback(() => {
    scrubberRectRef.current = null;
    setHoverScrubTime(null);
    isScrubbingRef.current = false;
  }, []);

  const handleScrubberClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      isScrubbingRef.current = false;
      if (!canControlRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickPos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      handleSeek(clickPos * durationRef.current);
    },
    [handleSeek]
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="group relative flex flex-col bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden select-none"
    >
      {/* Stream Header */}
      <PlayerHeaderBar
        provider={provider}
        title={currentMedia?.title || "Live Stream"}
        activeView={activeView}
        hasScreenStream={!!screenStream}
        canControl={canControl}
        onSetViewMode={setViewMode}
        onToggleUrlInput={() => setShowUrlInput((prev) => !prev)}
      />

      {/* URL Switcher Bar */}
      {showUrlInput && (
        <form
          onSubmit={handleUrlSubmit}
          className="p-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center gap-2 z-30"
        >
          <input
            type="url"
            required
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            placeholder="Paste YouTube, Twitch, Vimeo, or direct MP4 URL..."
            className="flex-1 bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-zinc-500 font-mono"
          />
          <button
            type="submit"
            className="bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Change Video
          </button>
        </form>
      )}

      {/* Video Viewport Stage */}
      <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
        {/* YouTube Stage — Default YouTube interactions disabled */}
        <div
          className={`w-full h-full pointer-events-none select-none [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:pointer-events-none ${
            provider === "YOUTUBE" && activeView === "MEDIA" ? "block" : "hidden"
          }`}
        >
          <div id={`yt-player-${iframeContainerId}`} className="w-full h-full pointer-events-none" />
        </div>

        {/* Direct Video Player Stage */}
        {(provider === "DIRECT_URL" || provider === "HLS") && activeView === "MEDIA" && (
          <video
            ref={directVideoRef}
            src={currentMedia?.sourceUrl}
            className="w-full h-full object-contain"
            playsInline
          />
        )}

        {/* WebRTC Live Screen Sharing Stage */}
        {activeView === "SCREEN" && (
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain bg-zinc-950"
          />
        )}

        {/* Click to Sync / Autoplay Unblock Overlay */}
        {needsInteraction && playbackState.isPlaying && (
          <div
            onClick={handleInteractiveSync}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer transition-all hover:bg-black/50"
          >
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-zinc-900/95 border border-zinc-700/80 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                <Play className="w-7 h-7 fill-current ml-0.5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Live Stream is Playing</p>
                <p className="text-xs text-zinc-400 mt-1">Click anywhere to sync audio & video</p>
              </div>
              <button
                type="button"
                className="mt-2 px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs shadow-lg transition-colors cursor-pointer"
              >
                Sync with Room
              </button>
            </div>
          </div>
        )}

        {/* Floating Reactions Overlay */}
        <FloatingReactionsOverlay reactions={floatingReactions} />

        {/* Player Controls Bar */}
        <PlayerControlsBar
          isPlaying={isPlaying}
          currentTime={localTime}
          duration={duration}
          bufferedPercent={bufferedPercent}
          volume={volume}
          isMuted={isMuted}
          playbackRate={playbackRate}
          isFullscreen={isFullscreen}
          canControl={canControl}
          showControls={showControls}
          showSpeedMenu={showSpeedMenu}
          hoverScrubTime={hoverScrubTime}
          onTogglePlay={handleTogglePlay}
          onSkip={handleSkip}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onRateChange={handleRateChange}
          onToggleSpeedMenu={() => setShowSpeedMenu((prev) => !prev)}
          onToggleFullscreen={toggleFullscreen}
          onScrubberMouseMove={handleScrubberMouseMove}
          onScrubberMouseLeave={handleScrubberMouseLeave}
          onScrubberClick={handleScrubberClick}
        />
      </div>
    </div>
  );
}
