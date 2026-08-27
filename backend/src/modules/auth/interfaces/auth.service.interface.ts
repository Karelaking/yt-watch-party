import type { AuthUserContext } from '../auth.types.js';
import type { IService } from '../../../core/interfaces/index.js';

export interface IAuthService extends IService {
  verifyToken(token: string): Promise<AuthUserContext>;
  resolveUserByClerkId(clerkUserId: string): Promise<AuthUserContext>;
}
