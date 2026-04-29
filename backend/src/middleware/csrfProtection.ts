import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthRequest } from './auth.js';

/**
 * CSRF Token Manager
 * Generates and validates CSRF tokens for state-changing operations
 */
export class CsrfTokenManager {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_EXPIRY = 3600000; // 1 hour in milliseconds
  
  // In-memory store for tokens (use Redis in production)
  private static tokens: Map<string, { token: string; expiresAt: number }> = new Map();

  /**
   * Generate a new CSRF token for a user session
   */
  static generateToken(userId: string): string {
    const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
    const expiresAt = Date.now() + this.TOKEN_EXPIRY;
    
    this.tokens.set(userId, { token, expiresAt });
    
    return token;
  }

  /**
   * Validate a CSRF token
   */
  static validateToken(userId: string, token: string): boolean {
    const stored = this.tokens.get(userId);
    
    if (!stored) {
      return false;
    }
    
    // Check expiry
    if (Date.now() > stored.expiresAt) {
      this.tokens.delete(userId);
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(stored.token),
      Buffer.from(token)
    );
  }

  /**
   * Invalidate a token (e.g., after logout)
   */
  static invalidateToken(userId: string): void {
    this.tokens.delete(userId);
  }

  /**
   * Clean up expired tokens
   */
  static cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [userId, data] of this.tokens.entries()) {
      if (now > data.expiresAt) {
        this.tokens.delete(userId);
      }
    }
  }
}

// Run cleanup every 10 minutes
setInterval(() => {
  CsrfTokenManager.cleanupExpiredTokens();
}, 600000);

/**
 * CSRF Protection Middleware
 * Validates CSRF token for state-changing operations (POST, PUT, PATCH, DELETE)
 */
export function csrfProtection(req: AuthRequest, res: Response, next: NextFunction): void {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  // Require authentication
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Get token from header or body
  const token = req.headers['x-csrf-token'] as string || req.body?._csrf;

  if (!token) {
    res.status(403).json({ 
      error: 'CSRF token missing',
      code: 'CSRF_TOKEN_MISSING'
    });
    return;
  }

  // Validate token
  if (!CsrfTokenManager.validateToken(req.userId, token)) {
    res.status(403).json({ 
      error: 'Invalid or expired CSRF token',
      code: 'CSRF_TOKEN_INVALID'
    });
    return;
  }

  next();
}

/**
 * Generate CSRF token endpoint
 * GET /api/csrf-token
 */
export function getCsrfToken(req: AuthRequest, res: Response): void {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = CsrfTokenManager.generateToken(req.userId);
  
  res.json({ 
    csrfToken: token,
    expiresIn: 3600 // seconds
  });
}

/**
 * Optional CSRF protection (warns but doesn't block)
 * Use for gradual rollout
 */
export function csrfProtectionOptional(req: AuthRequest, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  if (!req.userId) {
    next();
    return;
  }

  const token = req.headers['x-csrf-token'] as string || req.body?._csrf;

  if (!token || !CsrfTokenManager.validateToken(req.userId, token)) {
    console.warn(`[CSRF Warning] Missing or invalid token for user ${req.userId} on ${req.method} ${req.path}`);
  }

  next();
}

/**
 * Double Submit Cookie Pattern (alternative to token storage)
 * More stateless approach
 */
export class DoubleSubmitCsrf {
  private static readonly COOKIE_NAME = 'csrf-token';
  private static readonly SECRET = process.env.CSRF_SECRET || 'change-me-in-production';

  /**
   * Generate CSRF token and set cookie
   */
  static generateToken(res: Response): string {
    const token = crypto.randomBytes(32).toString('hex');
    const signature = this.signToken(token);
    
    res.cookie(this.COOKIE_NAME, `${token}.${signature}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });
    
    return token;
  }

  /**
   * Validate double submit token
   */
  static validateToken(req: Request): boolean {
    const cookieValue = req.cookies?.[this.COOKIE_NAME];
    const headerToken = req.headers['x-csrf-token'] as string;

    if (!cookieValue || !headerToken) {
      return false;
    }

    const [cookieToken, signature] = cookieValue.split('.');
    
    // Verify signature
    if (this.signToken(cookieToken) !== signature) {
      return false;
    }

    // Compare tokens (constant-time)
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
  }

  /**
   * Sign token with HMAC
   */
  private static signToken(token: string): string {
    return crypto
      .createHmac('sha256', this.SECRET)
      .update(token)
      .digest('hex');
  }
}

/**
 * Double Submit CSRF Protection Middleware
 */
export function doubleSubmitCsrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  if (!DoubleSubmitCsrf.validateToken(req)) {
    res.status(403).json({ 
      error: 'CSRF validation failed',
      code: 'CSRF_VALIDATION_FAILED'
    });
    return;
  }

  next();
}
