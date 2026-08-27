import type { Request } from 'express';

export interface AuthUserContext {
  id: string;
  clerkUserId: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}

export type AuthenticatedRequest = Request & {
  user: AuthUserContext;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUserContext;
      rawClerkClaims?: Record<string, unknown>;
    }
  }
}
