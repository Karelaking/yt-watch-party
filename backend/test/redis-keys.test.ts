import { describe, it, expect } from 'vitest';
import { RedisKeys } from '../src/infrastructure/redis/redis-keys.js';

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
});
