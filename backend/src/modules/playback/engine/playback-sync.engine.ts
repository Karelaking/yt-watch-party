export type PlaybackActionType = 'PLAY' | 'PAUSE' | 'SEEK' | 'CHANGE_VIDEO' | 'CHANGE_RATE';

export interface PlaybackStateSnapshot {
  roomId: string;
  mediaId: string | null;
  position: number;
  isPlaying: boolean;
  playbackRate: number;
  version: number;
  serverTimestamp: Date;
  lastAction?: PlaybackActionType | null;
  lastActionById?: string | null;
}

export interface ClientSyncPayload {
  action: PlaybackActionType;
  position?: number;
  playbackRate?: number;
  mediaId?: string;
  clientTimestamp?: number;
}

export interface IPlaybackSyncEngine {
  calculateCurrentPosition(state: PlaybackStateSnapshot, now?: Date): number;
  calculateDrift(clientPosition: number, state: PlaybackStateSnapshot, now?: Date): number;
  applyAction(state: PlaybackStateSnapshot, actorId: string, payload: ClientSyncPayload, now?: Date): PlaybackStateSnapshot;
}

export class PlaybackSyncEngine implements IPlaybackSyncEngine {
  public static readonly DRIFT_THRESHOLD_SECONDS = 1.5;

  public calculateCurrentPosition(state: PlaybackStateSnapshot, now: Date = new Date()): number {
    if (!state.isPlaying) {
      return state.position;
    }

    const serverTimeMs = state.serverTimestamp instanceof Date
      ? state.serverTimestamp.getTime()
      : typeof (state.serverTimestamp as any)?.epochMilliseconds === 'number'
      ? (state.serverTimestamp as any).epochMilliseconds
      : new Date(String(state.serverTimestamp)).getTime();

    const elapsedSeconds = Math.max(0, (now.getTime() - serverTimeMs) / 1000);
    return Math.max(0, state.position + elapsedSeconds * (state.playbackRate || 1.0));
  }

  public calculateDrift(clientPosition: number, state: PlaybackStateSnapshot, now: Date = new Date()): number {
    const expected = this.calculateCurrentPosition(state, now);
    return Math.abs(clientPosition - expected);
  }

  public applyAction(
    state: PlaybackStateSnapshot,
    actorId: string,
    payload: ClientSyncPayload,
    now: Date = new Date()
  ): PlaybackStateSnapshot {
    const nextVersion = state.version + 1;
    const currentCalculatedPos = this.calculateCurrentPosition(state, now);

    let nextPosition = payload.position !== undefined ? Math.max(0, payload.position) : currentCalculatedPos;
    let nextIsPlaying = state.isPlaying;
    let nextRate = payload.playbackRate !== undefined ? payload.playbackRate : state.playbackRate;
    let nextMediaId = payload.mediaId !== undefined ? payload.mediaId : state.mediaId;

    switch (payload.action) {
      case 'PLAY':
        nextIsPlaying = true;
        break;
      case 'PAUSE':
        nextIsPlaying = false;
        nextPosition = payload.position !== undefined ? payload.position : currentCalculatedPos;
        break;
      case 'SEEK':
        nextPosition = payload.position !== undefined ? Math.max(0, payload.position) : nextPosition;
        break;
      case 'CHANGE_RATE':
        nextRate = payload.playbackRate ?? 1.0;
        nextPosition = payload.position !== undefined ? payload.position : currentCalculatedPos;
        break;
      case 'CHANGE_VIDEO':
        nextMediaId = payload.mediaId !== undefined ? payload.mediaId : state.mediaId;
        nextPosition = payload.position !== undefined ? payload.position : 0;
        nextIsPlaying = true; // start playing newly queued video
        break;
    }

    return {
      roomId: state.roomId,
      mediaId: nextMediaId,
      position: nextPosition,
      isPlaying: nextIsPlaying,
      playbackRate: nextRate,
      version: nextVersion,
      serverTimestamp: now,
      lastAction: payload.action,
      lastActionById: actorId,
    };
  }
}
