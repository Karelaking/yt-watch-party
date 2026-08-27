import { AppError } from './app-error.js';

export class UnauthorizedError extends AppError {
  public readonly statusCode = 401;

  constructor(message: string = 'Authentication required', code: string = 'UNAUTHORIZED', details?: unknown) {
    super(message, code, details);
  }
}

export class ForbiddenError extends AppError {
  public readonly statusCode = 403;

  constructor(message: string = 'Access denied: insufficient permissions', code: string = 'FORBIDDEN', details?: unknown) {
    super(message, code, details);
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;

  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND', details?: unknown) {
    super(message, code, details);
  }
}

export class BadRequestError extends AppError {
  public readonly statusCode = 400;

  constructor(message: string = 'Bad request', code: string = 'BAD_REQUEST', details?: unknown) {
    super(message, code, details);
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 422;

  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class ConflictError extends AppError {
  public readonly statusCode = 409;

  constructor(message: string = 'Resource conflict', code: string = 'CONFLICT', details?: unknown) {
    super(message, code, details);
  }
}

export * from './app-error.js';
