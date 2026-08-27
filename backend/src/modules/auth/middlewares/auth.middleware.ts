import type { Request, Response, NextFunction } from 'express';
import { container } from '../../../core/di/container.js';
import { TYPES } from '../../../core/di/identifiers.js';
import type { IAuthService } from '../interfaces/auth.service.interface.js';
import { UnauthorizedError } from '../../../core/errors/index.js';

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0]?.toLowerCase() === 'bearer') {
    return parts[1] || null;
  }
  return null;
}

export async function authenticateUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return next();
    }

    const authService = container.resolve<IAuthService>(TYPES.AuthService);
    req.user = await authService.verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    try {
      const token = extractBearerToken(req);
      if (!token) {
        return next(new UnauthorizedError('Authentication required to access this resource'));
      }
      const authService = container.resolve<IAuthService>(TYPES.AuthService);
      req.user = await authService.verifyToken(token);
    } catch (error) {
      return next(error);
    }
  }

  if (!req.user) {
    return next(new UnauthorizedError('Authentication required to access this resource'));
  }
  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  authenticateUser(req, res, next);
}

