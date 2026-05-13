import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

/**
 * Middleware to set RLS context based on authenticated user
 * This should be used after authentication middleware
 * SECURITY: Uses parameterized queries to prevent SQL injection
 */
export const setRLSContext = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (req.userId) {
      // Use parameterized query to prevent SQL injection
      await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${req.userId}, false)`;
      
      if (req.isAdmin) {
        await prisma.$executeRaw`SELECT set_config('app.is_admin', 'true', false)`;
      }
    }
    next();
  } catch (error) {
    console.error('Error setting RLS context:', error);
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
    await prisma.$executeRaw`SELECT set_config('app.is_system', 'true', false)`;
    next();
  } catch (error) {
    console.error('Error setting system context:', error);
    next(error);
  }
};

/**
 * Helper function to execute queries with system context
 * Use this for internal operations that need to bypass RLS
 * Example: await withSystemContext(async () => { ... })
 */
export async function withSystemContext<T>(
  operation: () => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Set system context (true = transaction-local)
    await tx.$executeRaw`SELECT set_config('app.is_system', 'true', true)`;
    
    // Execute operation
    const result = await operation();
    
    // Context is automatically cleared at end of transaction
    return result;
  });
}

/**
 * Helper function to execute queries with specific user context
 * Useful for testing or admin operations on behalf of users
 * Example: await withUserContext(userId, async () => { ... })
 */
export async function withUserContext<T>(
  userId: string,
  operation: () => Promise<T>,
  isAdmin: boolean = false
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Set user context (true = transaction-local)
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    
    if (isAdmin) {
      await tx.$executeRaw`SELECT set_config('app.is_admin', 'true', true)`;
    }
    
    // Execute operation
    const result = await operation();
    
    // Context is automatically cleared at end of transaction
    return result;
  });
}

/**
 * Middleware to clear RLS context after request
 * This ensures context doesn't leak between requests
 * Note: This is usually not needed as Prisma uses connection pooling
 * and PostgreSQL clears session variables between connections
 */
export const clearRLSContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Clear context variables
    await prisma.$executeRaw`SELECT set_config('app.current_user_id', '', false)`;
    await prisma.$executeRaw`SELECT set_config('app.is_admin', 'false', false)`;
    await prisma.$executeRaw`SELECT set_config('app.is_system', 'false', false)`;
    
    next();
  } catch (error) {
    console.error('Error clearing RLS context:', error);
    next(error);
  }
};

/**
 * Example usage in routes:
 * 
 * // For authenticated routes:
 * router.get('/profile', authMiddleware, async (req, res) => {
 *   // RLS context is automatically set by authMiddleware
 *   const user = await prisma.user.findUnique({ where: { id: req.user_id } });
 *   res.json(user);
 * });
 * 
 * // For system operations (cron jobs, background tasks):
 * async function processPayments() {
 *   await withSystemContext(async () => {
 *     // This bypasses RLS
 *     await prisma.wallet.updateMany({ ... });
 *   });
 * }
 * 
 * // For admin operations on behalf of users:
 * router.post('/admin/update-user/:userId', authMiddleware, adminAuth, async (req, res) => {
 *   await withUserContext(req.params.user_id, async () => {
 *     // This runs as the target user
 *     await prisma.user.update({ ... });
 *   });
 * });
 */
