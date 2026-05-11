import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { jwtSecretManager } from '../utils/jwtRotation.js';
import { prisma } from '../config/database.js';

export interface AuthRequest extends Request {
  userId?: string;
  deviceId?: string;
  isAdmin?: boolean;
  isWalletUnlocked?: boolean;
  accountType?: 'CREATOR' | 'BUSINESS';
}

export interface JwtPayload {
  userId: string;
  deviceId: string;
  isAdmin: boolean;
  isWalletUnlocked: boolean;
  accountType: 'CREATOR' | 'BUSINESS';
  iat: number;
  exp: number;
}

/**
 * JWT authentication middleware.
 * Verifies the access token from the Authorization header.
 * Attaches userId and deviceId to the request object.
 * Sets RLS context for database security.
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // Use JWT rotation manager for verification
    const decoded = jwtSecretManager.verifyToken(token) as JwtPayload;
    req.userId = decoded.userId;
    req.deviceId = decoded.deviceId;
    req.isAdmin = decoded.isAdmin;
    req.isWalletUnlocked = decoded.isWalletUnlocked;
    req.accountType = decoded.accountType;

    // Set RLS context for database security
    try {
      await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${decoded.userId}, false)`;
      
      if (decoded.isAdmin) {
        await prisma.$executeRaw`SELECT set_config('app.is_admin', 'true', false)`;
      }
    } catch (rlsError) {
      console.error('Failed to set RLS context:', rlsError);
      // Continue anyway - RLS is defense in depth, not primary security
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
      return;
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Admin authentication middleware.
 * Must be used AFTER authMiddleware.
 */
export function adminAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.isAdmin) {
    res.status(403).json({ error: 'Forbidden: Requires admin privileges' });
    return;
  }
  next();
}

/**
 * Optional auth — doesn't fail if no token, but attaches userId if present.
 * Used for public endpoints that show extra data for authenticated users.
 * Sets RLS context if user is authenticated.
 */
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      // Use JWT rotation manager for verification
      const decoded = jwtSecretManager.verifyToken(token) as JwtPayload;
      req.userId = decoded.userId;
      req.deviceId = decoded.deviceId;
      req.isAdmin = decoded.isAdmin;
      req.isWalletUnlocked = decoded.isWalletUnlocked;
      req.accountType = decoded.accountType;

      // Set RLS context for authenticated users
      try {
        await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${decoded.userId}, false)`;
        
        if (decoded.isAdmin) {
          await prisma.$executeRaw`SELECT set_config('app.is_admin', 'true', false)`;
        }
      } catch (rlsError) {
        console.error('Failed to set RLS context:', rlsError);
      }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        return;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
        return;
      }
      // Silently continue for other unknown errors
    }
  }

  next();
}

// Export aliases for compatibility
export const authenticate = authMiddleware;
export const authenticateToken = authMiddleware;
export const requireAdmin = adminAuth;
