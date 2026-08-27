import type { Request, Response, NextFunction } from 'express';
import { type ZodType, ZodError } from 'zod';
import { ValidationError } from '../errors/index.js';

interface RequestValidationSchema {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function validateRequest(schemas: RequestValidationSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        const parsed = await schemas.query.parseAsync(req.query);
        try {
          Object.assign(req.query, parsed);
        } catch {
          // ignore read-only proxy in some engines
        }
      }
      if (schemas.params) {
        const parsed = await schemas.params.parseAsync(req.params);
        try {
          Object.assign(req.params, parsed);
        } catch {
          // ignore read-only proxy in some engines
        }
      }
      next();

    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));
        next(new ValidationError('Invalid request payload', issues));
      } else {
        next(error);
      }
    }
  };
}
