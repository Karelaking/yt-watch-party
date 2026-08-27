import type { Request, Response, NextFunction } from 'express';

export interface IController {
  // Base marker for all controllers
}

export interface IService {
  // Base marker for all business services
}

export interface IRepository<T = unknown> {
  // Base marker for data repositories
}

export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;

export abstract class BaseController implements IController {
  protected ok<T>(res: Response, data: T, message?: string): Response {
    return res.status(200).json({
      success: true,
      data,
      ...(message ? { message } : {}),
    });
  }

  protected created<T>(res: Response, data: T, message?: string): Response {
    return res.status(201).json({
      success: true,
      data,
      ...(message ? { message } : {}),
    });
  }

  protected noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Helper to bind controller methods safely to the instance
   */
  protected catchAsync(fn: AsyncHandler): AsyncHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      return fn.call(this, req, res, next).catch(next);
    };
  }
}
