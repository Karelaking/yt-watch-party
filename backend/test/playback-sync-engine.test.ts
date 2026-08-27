import { describe, it, expect } from 'vitest';
import { PlaybackSyncEngine, type PlaybackStateSnapshot } from '../src/modules/playback/engine/playback-sync.engine.js';

describe('PlaybackSyncEngine', () => {
  const engine = new PlaybackSyncEngine();

  const baseState: PlaybackStateSnapshot = {
    roomId: 'room-1',
    mediaId: 'media-1',
    position: 10,
    isPlaying: false,
    playbackRate: 1.0,
    version: 1,
    serverTimestamp: new Date('2026-08-27T10:00:00Z'),
  };

  describe('calculateCurrentPosition', () => {
    it('should return static position if paused', () => {
      const now = new Date('2026-08-27T10:00:15Z');
      const pos = engine.calculateCurrentPosition(baseState, now);
      expect(pos).toBe(10);
    });

    it('should calculate elapsed seconds * rate if playing', () => {
      const playingState: PlaybackStateSnapshot = {
        ...baseState,
        isPlaying: true,
        playbackRate: 1.5,
      };
      const now = new Date('2026-08-27T10:00:10Z'); // 10 seconds later
      const pos = engine.calculateCurrentPosition(playingState, now);
      // 10 + (10 * 1.5) = 25
      expect(pos).toBe(25);
    });
  });

  describe('applyAction', () => {
    it('should handle PLAY action and increment version', () => {
      const now = new Date('2026-08-27T10:00:05Z');
      const next = engine.applyAction(baseState, 'user-1', { action: 'PLAY', position: 12 }, now);

      expect(next.isPlaying).toBe(true);
      expect(next.position).toBe(12);
      expect(next.version).toBe(2);
      expect(next.lastAction).toBe('PLAY');
      expect(next.lastActionById).toBe('user-1');
    });

    it('should handle PAUSE action and freeze calculated position', () => {
      const playingState: PlaybackStateSnapshot = {
        ...baseState,
        isPlaying: true,
        serverTimestamp: new Date('2026-08-27T10:00:00Z'),
      };
      const now = new Date('2026-08-27T10:00:08Z'); // 8s later -> pos 18
      const next = engine.applyAction(playingState, 'user-1', { action: 'PAUSE' }, now);

      expect(next.isPlaying).toBe(false);
      expect(next.position).toBe(18);
      expect(next.version).toBe(2);
      expect(next.lastAction).toBe('PAUSE');
    });

    it('should handle SEEK action', () => {
      const now = new Date('2026-08-27T10:00:02Z');
      const next = engine.applyAction(baseState, 'user-1', { action: 'SEEK', position: 120 }, now);

      expect(next.position).toBe(120);
      expect(next.version).toBe(2);
      expect(next.lastAction).toBe('SEEK');
    });

    it('should handle CHANGE_RATE action', () => {
      const now = new Date('2026-08-27T10:00:02Z');
      const next = engine.applyAction(baseState, 'user-1', { action: 'CHANGE_RATE', playbackRate: 2.0 }, now);

      expect(next.playbackRate).toBe(2.0);
      expect(next.version).toBe(2);
    });

    it('should handle CHANGE_VIDEO action', () => {
      const now = new Date('2026-08-27T10:00:02Z');
      const next = engine.applyAction(baseState, 'user-1', { action: 'CHANGE_VIDEO', mediaId: 'media-new', position: 0 }, now);

      expect(next.mediaId).toBe('media-new');
      expect(next.position).toBe(0);
      expect(next.isPlaying).toBe(true);
      expect(next.version).toBe(2);
    });
  });

  describe('calculateDrift', () => {
    it('should calculate accurate absolute drift', () => {
      const playingState: PlaybackStateSnapshot = {
        ...baseState,
        isPlaying: true,
        position: 10,
        serverTimestamp: new Date('2026-08-27T10:00:00Z'),
      };
      const now = new Date('2026-08-27T10:00:10Z'); // expected position = 20
      const drift = engine.calculateDrift(17.5, playingState, now);
      expect(drift).toBeCloseTo(2.5);
    });

    it('should safely calculate position when serverTimestamp is a Temporal-like object', () => {
      const mockTemporal = {
        epochMilliseconds: new Date('2026-08-27T10:00:00Z').getTime(),
        toString: () => '2026-08-27T10:00:00Z',
        valueOf: () => {
          throw new TypeError('Do not use Temporal.Instant.prototype.valueOf; use Temporal.Instant.prototype.compare for comparison.');
        },
      };

      const playingState: any = {
        ...baseState,
        isPlaying: true,
        playbackRate: 1.0,
        position: 10,
        serverTimestamp: mockTemporal,
      };

      const now = new Date('2026-08-27T10:00:10Z');
      const pos = engine.calculateCurrentPosition(playingState, now);
      expect(pos).toBe(20);
    });
  });
});
