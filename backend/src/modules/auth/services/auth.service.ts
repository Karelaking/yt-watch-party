import type { IAuthService } from '../interfaces/auth.service.interface.js';
import type { IClerkClientAdapter } from '../infrastructure/clerk-client.adapter.js';
import type { IUserRepository } from '../../users/repositories/user.repository.interface.js';
import type { AuthUserContext } from '../auth.types.js';
import { UnauthorizedError } from '../../../core/errors/index.js';

export class AuthService implements IAuthService {
  constructor(
    private readonly clerkClient: IClerkClientAdapter,
    private readonly userRepository: IUserRepository
  ) {}

  public async verifyToken(token: string): Promise<AuthUserContext> {
    if (!token) {
      throw new UnauthorizedError('Authentication token is missing');
    }

    const { sub } = await this.clerkClient.verifyJwt(token);
    return this.resolveUserByClerkId(sub);
  }

  public async resolveUserByClerkId(clerkUserId: string): Promise<AuthUserContext> {
    let user = await this.userRepository.findByClerkId(clerkUserId);

    // Just-in-Time (JIT) Provisioning if user logged in via Clerk but DB record is missing
    if (!user) {
      const clerkProfile = await this.clerkClient.fetchUser(clerkUserId);
      user = await this.userRepository.create({
        clerkUserId,
        email: clerkProfile?.email || null,
        displayName: clerkProfile?.displayName || null,
        avatarUrl: clerkProfile?.avatarUrl || null,
        username: clerkProfile?.username || null,
        status: 'ACTIVE',
      });
    }

    if (user.status === 'SUSPENDED' || user.status === 'DELETED') {
      throw new UnauthorizedError(`Account is ${user.status.toLowerCase()}`, 'ACCOUNT_INACTIVE');
    }

    return {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
    };
  }
}
