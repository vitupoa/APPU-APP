import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const SECRET_REGEX = /(password|secret|token|hash|key)[\s]*[:=][\s]*['"]?([^\s'",}]+)/gi;

function redactPII(text: string): string {
  if (!text) return text;
  return text
    .replace(EMAIL_REGEX, '***@***.***')
    .replace(PHONE_REGEX, '[REDACTED_PHONE]')
    .replace(SECRET_REGEX, '$1: [REDACTED_SECRET]');
}

interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
}

export class AppError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number = 500, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const secureMessage = redactPII(err.message);
  console.error(`[ERROR] ${err.name}: ${secureMessage}`);

  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
    });
    return;
  }

  // Known application errors
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(409).json({
      error: 'Database conflict — resource may already exist',
      code: 'DB_CONFLICT',
    });
    return;
  }

  // Unknown errors
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
