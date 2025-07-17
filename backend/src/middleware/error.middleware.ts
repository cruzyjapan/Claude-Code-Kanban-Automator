import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        statusCode: err.statusCode
      }
    });
  } else {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        statusCode: 500
      }
    });
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: 'Resource not found',
      statusCode: 404
    }
  });
}