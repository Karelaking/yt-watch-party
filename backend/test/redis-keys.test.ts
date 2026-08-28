import { describe, it, expect } from 'vitest';
import { RedisKeys, RedisTTL } from '../src/infrastructure/redis/redis-keys.js';

describe('RedisKeys Taxonomy', () => {
  it('should generate properly formatted room keys', () => {
    const roomId = 'room-123';
    expect(RedisKeys.roomPresence(roomId)).toBe('watchparty:room:room-123:presence');
    expect(RedisKeys.roomConnections(roomId)).toBe('watchparty:room:room-123:connections');
    expect(RedisKeys.roomPlayback(roomId)).toBe('watchparty:room:room-123:playback');
    expect(RedisKeys.roomState(roomId)).toBe('watchparty:room:room-123:state');
    expect(RedisKeys.roomTyping(roomId)).toBe('watchparty:room:room-123:typing');
    expect(RedisKeys.roomViewers(roomId)).toBe('watchparty:room:room-123:viewers');
    expect(RedisKeys.lockPlayback(roomId)).toBe('watchparty:room:room-123:lock:playback');
    expect(RedisKeys.lockPlaylist(roomId)).toBe('watchparty:room:room-123:lock:playlist');
  });

  it('should generate properly formatted user and socket keys', () => {
    expect(RedisKeys.userPresence('user-1')).toBe('watchparty:user:user-1:presence');
    expect(RedisKeys.socketUser('sock-abc')).toBe('watchparty:socket:sock-abc:user');
    expect(RedisKeys.socketRoom('sock-abc')).toBe('watchparty:socket:sock-abc:room');
  });

  it('should generate properly formatted rate limiter keys', () => {
    expect(RedisKeys.rateUserMessages('user-1')).toBe('watchparty:rate:user:user-1:messages');
    expect(RedisKeys.rateUserRequests('user-1')).toBe('watchparty:rate:user:user-1:requests');
    expect(RedisKeys.rateIpRequests('192.168.1.1')).toBe('watchparty:rate:ip:192.168.1.1:requests');
  });

  it('should generate properly formatted caching and session accumulator keys', () => {
    expect(RedisKeys.roomMeta('room-123')).toBe('watchparty:room:room-123:meta');
    expect(RedisKeys.roomSettings('room-123')).toBe('watchparty:room:room-123:settings');
    expect(RedisKeys.roomBans('room-123')).toBe('watchparty:room:room-123:bans');
    expect(RedisKeys.sessionsPendingWatchTime()).toBe('watchparty:sessions:pending_watch_time');
  });

  it('should export standard RedisTTL policies', () => {
    expect(RedisTTL.SOCKET_USER).toBe(86400);
    expect(RedisTTL.SOCKET_ROOM).toBe(86400);
    expect(RedisTTL.ROOM_PRESENCE).toBe(86400);
    expect(RedisTTL.ROOM_CONNECTIONS).toBe(86400);
    expect(RedisTTL.ROOM_VIEWERS).toBe(86400);
    expect(RedisTTL.USER_PRESENCE_ONLINE).toBe(86400);
    expect(RedisTTL.USER_PRESENCE_OFFLINE).toBe(3600);
    expect(RedisTTL.TYPING_INDICATOR).toBe(5);
    expect(RedisTTL.PENDING_WATCH_TIME).toBe(86400);
    expect(RedisTTL.PROCESSING_BATCH).toBe(600);
    expect(RedisTTL.LOCK_PLAYBACK_MS).toBe(3000);
  });
});
