import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

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
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.userId = decoded.userId;
    req.deviceId = decoded.deviceId;
    req.isAdmin = decoded.isAdmin;
    req.isWalletUnlocked = decoded.isWalletUnlocked;
    req.accountType = decoded.accountType;
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
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      req.userId = decoded.userId;
      req.deviceId = decoded.deviceId;
    } catch {
      // Silently continue — user is unauthenticated
    }
  }

  next();
}
