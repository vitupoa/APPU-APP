import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthRequest } from './auth.js';

/**
 * Row-Level Security (RLS) Middleware
 * 
 * This middleware sets the current user ID in PostgreSQL session variables
 * to enforce Row-Level Security policies at the database level.
 * 
 * CRITICAL: This provides defense-in-depth security beyond application-level auth.
 * Even if application logic is bypassed, the database will enforce access control.
 * 
 * Usage: Apply AFTER authMiddleware
 */
export async function rlsMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Only set RLS context if user is authenticated
    if (req.userId) {
      // Set the current user ID in PostgreSQL session variable
      // This is used by RLS policies to determine access rights
      await prisma.$executeRawUnsafe(
        `SELECT set_config('app.current_user_id', '${req.userId}', false)`
      );
      
      console.log(`[RLS] Set user context: ${req.userId}`);
    }
    
    next();
  } catch (error) {
    console.error('[RLS] Failed to set user context:', error);
    // Don't fail the request, but log the error
    // RLS will default to denying access if context is not set
    next();
  }
}

/**
 * Clear RLS context after request completes
 * This ensures the session variable doesn't leak to other requests
 */
export async function clearRlsContext(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Clear the session variable
    await prisma.$executeRawUnsafe(
      `SELECT set_config('app.current_user_id', '', false)`
    );
  } catch (error) {
    console.error('[RLS] Failed to clear user context:', error);
  }
  
  next();
}

/**
 * Admin RLS Middleware
 * Sets admin context for privileged operations
 */
export async function adminRlsMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.userId && req.isAdmin) {
      // Set both user ID and admin flag
      await prisma.$executeRawUnsafe(
        `SELECT set_config('app.current_user_id', '${req.userId}', false)`
      );
      await prisma.$executeRawUnsafe(
        `SELECT set_config('app.is_admin', 'true', false)`
      );
      
      console.log(`[RLS] Set admin context: ${req.userId}`);
    }
    
    next();
  } catch (error) {
    console.error('[RLS] Failed to set admin context:', error);
    next();
  }
}
