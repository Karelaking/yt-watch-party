export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public readonly isOperational: boolean = true;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, code: string = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}
