import type { IRepository } from '../../../core/interfaces/index.js';

export interface WatchSessionEntity {
  id: string;
  roomId: string;
  userId: string;
  status: 'ACTIVE' | 'ENDED';
  joinedAt: Date;
  leftAt: Date | null;
  totalWatchSeconds: number;
  lastHeartbeatAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScreenShareSessionEntity {
  id: string;
  roomId: string;
  userId: string;
  status: 'ACTIVE' | 'ENDED';
  startedAt: Date;
  endedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionRepository extends IRepository {
  startWatchSession(roomId: string, userId: string): Promise<WatchSessionEntity>;
  heartbeatWatchSession(sessionId: string): Promise<void>;
  endWatchSession(sessionId: string): Promise<void>;
  startScreenShare(roomId: string, userId: string, metadata?: Record<string, unknown>): Promise<ScreenShareSessionEntity>;
  endScreenShare(sessionId: string): Promise<void>;
}
