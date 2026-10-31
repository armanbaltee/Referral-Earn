import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../common/errors.js';
import { env } from '../config/env.js';
import type { ValidationError } from '../types/index.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod Validation Error
  if (err instanceof ZodError) {
    const errors: ValidationError[] = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  // Operational App Error
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Mongoose Duplicate Key Error
  if (isMongooseDuplicateKeyError(err)) {
    const field =
      Object.keys((err as { keyValue: Record<string, unknown> }).keyValue)[0] ?? 'field';
    res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
    return;
  }

  // Mongoose Cast Error (invalid ObjectId)
  if (isMongooseCastError(err)) {
    res.status(400).json({
      success: false,
      message: 'Invalid resource ID format',
    });
    return;
  }

  // JWT Errors
  if (isJwtError(err)) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
    return;
  }

  // Unknown Error
  const message = env.NODE_ENV === 'production' ? 'Internal server error' : String(err);

  if (env.NODE_ENV !== 'production') {
    console.error('❌ Unhandled error:', err);
  }

  res.status(500).json({
    success: false,
    message,
  });
}

function isMongooseDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 11000
  );
}

function isMongooseCastError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'CastError'
  );
}

function isJwtError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null || !('name' in err)) {
    return false;
  }
  const name = (err as { name: string }).name;
  return name === 'JsonWebTokenError' || name === 'TokenExpiredError' || name === 'NotBeforeError';
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}
