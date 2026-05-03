import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';

export const setRLSContext = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (req.userId) {
      await prisma.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${req.userId}'`);
      if (req.user?.isAdmin) {
        await prisma.$executeRawUnsafe(`SET LOCAL app.is_admin = 'true'`);
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to set system user context for internal operations
 * Use this for operations that should bypass RLS (e.g., cron jobs, system tasks)
 */
export const setSystemContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await prisma.$executeRawUnsafe(
      `SET LOCAL app.is_system = 'true'`
    );
    
    next();
  } catch (error) {
    console.error('Error setting system context:', error);
    next(error);
  }
};

/**
 * Helper function to execute queries with system context
 * Use this for internal operations that need to bypass RLS
 */
export async function withSystemContext<T>(
  operation: () => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Set system context
    await tx.$executeRawUnsafe(`SET LOCAL app.is_system = 'true'`);
    
    // Execute operation
    return operation();
  });
}

/**
 * Helper function to execute queries with specific user context
 * Useful for testing or admin operations on behalf of users
 */
export async function withUserContext<T>(
  userId: string,
  operation: () => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Set user context
    await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${userId}'`);
    
    // Execute operation
    return operation();
  });
}

/**
 * Middleware to clear RLS context after request
 * This ensures context doesn't leak between requests
 */
export const clearRLSContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Clear context variables
    await prisma.$executeRawUnsafe(`RESET app.current_user_id`);
    await prisma.$executeRawUnsafe(`RESET app.is_admin`);
    await prisma.$executeRawUnsafe(`RESET app.is_system`);
    
    next();
  } catch (error) {
    console.error('Error clearing RLS context:', error);
    next(error);
  }
};
