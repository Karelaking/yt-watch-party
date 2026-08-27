import { createClerkClient, verifyToken } from '@clerk/backend';
import { env } from '../../../config/env.config.js';
import { UnauthorizedError } from '../../../core/errors/index.js';

export interface ClerkUserSummary {
  id: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  username?: string | null;
}

export interface IClerkClientAdapter {
  verifyJwt(token: string): Promise<{ sub: string; claims: Record<string, unknown> }>;
  fetchUser(clerkUserId: string): Promise<ClerkUserSummary | null>;
}

export class ClerkClientAdapter implements IClerkClientAdapter {
  private clerkClient;

  constructor() {
    if (env.CLERK_SECRET_KEY) {
      this.clerkClient = createClerkClient({
        secretKey: env.CLERK_SECRET_KEY,
        publishableKey: env.CLERK_PUBLISHABLE_KEY,
        jwtKey: env.CLERK_JWT_KEY || undefined,
      });
    }
  }

  public async verifyJwt(token: string): Promise<{ sub: string; claims: Record<string, unknown> }> {
    try {
      if (!env.CLERK_SECRET_KEY && !env.CLERK_JWT_KEY) {
        // In local mock / test mode when secret is not provided
        if (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') {
          // Parse unverified JWT payload for dev ease if mock token
          if (token.startsWith('mock_token_')) {
            const userId = token.replace('mock_token_', '');
            return { sub: userId, claims: { sub: userId } };
          }
        }
      }

      const verified = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY || undefined,
        jwtKey: env.CLERK_JWT_KEY || undefined,
        clockSkewInMs: 60000, // 60s grace period to absorb network delays / clock drift
      });

      if (!verified || !verified.sub) {
        throw new UnauthorizedError('Invalid token payload: missing subject identifier');
      }

      return {
        sub: verified.sub,
        claims: verified as unknown as Record<string, unknown>,
      };
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      throw new UnauthorizedError(`Clerk token verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  public async fetchUser(clerkUserId: string): Promise<ClerkUserSummary | null> {
    if (!this.clerkClient) {
      return null;
    }
    try {
      const clerkUser = await this.clerkClient.users.getUser(clerkUserId);
      if (!clerkUser) return null;

      const primaryEmail = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || null;

      const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;

      return {
        id: clerkUser.id,
        email: primaryEmail,
        displayName: fullName || clerkUser.username || null,
        avatarUrl: clerkUser.imageUrl || null,
        username: clerkUser.username || null,
      };
    } catch (error) {
      console.warn(`[ClerkClientAdapter] Failed to fetch Clerk user ${clerkUserId}:`, error);
      return null;
    }
  }
}
