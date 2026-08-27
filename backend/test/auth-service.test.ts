import { describe, it, expect, vi } from 'vitest';
import { AuthService } from '../src/modules/auth/services/auth.service.js';
import type { IClerkClientAdapter } from '../src/modules/auth/infrastructure/clerk-client.adapter.js';
import type { IUserRepository, UserEntity } from '../src/modules/users/repositories/user.repository.interface.js';

describe('AuthService', () => {
  const existingUser: UserEntity = {
    id: 'user-uuid-1',
    clerkUserId: 'user_clerk_1',
    email: 'test@example.com',
    displayName: 'Test User',
    avatarUrl: 'https://example.com/avatar.png',
    username: 'testuser',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockClerkAdapter: IClerkClientAdapter = {
    verifyJwt: vi.fn(async (token: string) => {
      if (token === 'valid_token') {
        return { sub: 'user_clerk_1', claims: { sub: 'user_clerk_1' } };
      }
      if (token === 'new_user_token') {
        return { sub: 'user_clerk_new', claims: { sub: 'user_clerk_new' } };
      }
      throw new Error('Invalid token');
    }),
    fetchUser: vi.fn(async (id: string) => ({
      id,
      email: 'new@example.com',
      displayName: 'New User',
      avatarUrl: null,
      username: 'newuser',
    })),
  };

  it('should verify token and return existing user context', async () => {
    const mockUserRepo: IUserRepository = {
      findById: vi.fn(async () => existingUser),
      findByClerkId: vi.fn(async (id) => (id === 'user_clerk_1' ? existingUser : null)),
      findByEmail: vi.fn(async () => null),
      create: vi.fn(),
      update: vi.fn(),
      updateByClerkId: vi.fn(),
      delete: vi.fn(),
    };

    const authService = new AuthService(mockClerkAdapter, mockUserRepo);
    const userContext = await authService.verifyToken('valid_token');

    expect(userContext.id).toBe('user-uuid-1');
    expect(userContext.clerkUserId).toBe('user_clerk_1');
    expect(userContext.email).toBe('test@example.com');
  });

  it('should JIT-provision user if user is verified by Clerk but not yet in database', async () => {
    const createdUser: UserEntity = {
      ...existingUser,
      id: 'new-uuid-2',
      clerkUserId: 'user_clerk_new',
      email: 'new@example.com',
    };

    const mockUserRepo: IUserRepository = {
      findById: vi.fn(async () => null),
      findByClerkId: vi.fn(async () => null),
      findByEmail: vi.fn(async () => null),
      create: vi.fn(async () => createdUser),
      update: vi.fn(),
      updateByClerkId: vi.fn(),
      delete: vi.fn(),
    };

    const authService = new AuthService(mockClerkAdapter, mockUserRepo);
    const userContext = await authService.verifyToken('new_user_token');

    expect(mockUserRepo.create).toHaveBeenCalledOnce();
    expect(userContext.id).toBe('new-uuid-2');
    expect(userContext.clerkUserId).toBe('user_clerk_new');
  });
});
