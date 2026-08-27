import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';
import { env } from '../../config/env.config.js';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Handle generic / unexpected error
  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);

  const isDev = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDev ? err.message : 'An unexpected internal error occurred',
      statusCode: 500,
      ...(isDev && err.stack ? { stack: err.stack } : {}),
    },
  });
};
