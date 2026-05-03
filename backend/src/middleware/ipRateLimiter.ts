import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { redis } from '../config/redis.js';

/**
 * IP-Based Rate Limiting Middleware
 * 
 * Implements distributed rate limiting using Redis to prevent:
 * - Brute force attacks
 * - DDoS attacks
 * - API abuse
 * 
 * CRITICAL: This provides protection against automated attacks
 * and ensures fair resource usage across all users.
 */

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  blockDurationMs?: number; // How long to block after exceeding limit
  skipSuccessfulRequests?: boolean; // Only count failed requests
}

/**
 * Create IP-based rate limiter
 */
export function createIpRateLimiter(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get client IP (handle proxies)
      const ip = getClientIp(req);
      
      if (!ip) {
        console.warn('[Rate Limit] Could not determine client IP');
        next();
        return;
      }

      const key = `rate_limit:ip:${ip}`;
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Get current request count
      const requests = await redis.zrangebyscore(key, windowStart, now);
      const requestCount = requests.length;

      // Check if blocked
      const blockKey = `rate_limit:block:${ip}`;
      const isBlocked = await redis.get(blockKey);
      
      if (isBlocked) {
        const ttl = await redis.ttl(blockKey);
        res.status(429).json({
          error: 'Too many requests. You have been temporarily blocked.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: ttl,
          blockedUntil: new Date(now + ttl * 1000).toISOString()
        });
        return;
      }

      // Check if limit exceeded
      if (requestCount >= config.maxRequests) {
        // Block the IP
        if (config.blockDurationMs) {
          await redis.setex(
            blockKey,
            Math.floor(config.blockDurationMs / 1000),
            '1'
          );
        }

        res.status(429).json({
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          limit: config.maxRequests,
          window: config.windowMs / 1000,
          retryAfter: Math.ceil(config.windowMs / 1000)
        });
        return;
      }

      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set expiry on the key
      await redis.expire(key, Math.ceil(config.windowMs / 1000));

      // Clean up old entries
      await redis.zremrangebyscore(key, 0, windowStart);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', config.maxRequests - requestCount - 1);
      res.setHeader('X-RateLimit-Reset', new Date(now + config.windowMs).toISOString());

      next();
    } catch (error) {
      console.error('[Rate Limit] Error:', error);
      // Don't block request on rate limiter error
      next();
    }
  };
}

/**
 * Create user-based rate limiter (requires authentication)
 */
export function createUserRateLimiter(config: RateLimitConfig) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId;
      
      if (!userId) {
        // If not authenticated, fall back to IP-based limiting
        return createIpRateLimiter(config)(req, res, next);
      }

      const key = `rate_limit:user:${userId}`;
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Get current request count
      const requests = await redis.zrangebyscore(key, windowStart, now);
      const requestCount = requests.length;

      // Check if blocked
      const blockKey = `rate_limit:block:user:${userId}`;
      const isBlocked = await redis.get(blockKey);
      
      if (isBlocked) {
        const ttl = await redis.ttl(blockKey);
        res.status(429).json({
          error: 'Too many requests. Your account has been temporarily rate limited.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: ttl
        });
        return;
      }

      // Check if limit exceeded
      if (requestCount >= config.maxRequests) {
        // Block the user
        if (config.blockDurationMs) {
          await redis.setex(
            blockKey,
            Math.floor(config.blockDurationMs / 1000),
            '1'
          );
        }

        res.status(429).json({
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          limit: config.maxRequests,
          window: config.windowMs / 1000,
          retryAfter: Math.ceil(config.windowMs / 1000)
        });
        return;
      }

      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set expiry on the key
      await redis.expire(key, Math.ceil(config.windowMs / 1000));

      // Clean up old entries
      await redis.zremrangebyscore(key, 0, windowStart);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', config.maxRequests - requestCount - 1);
      res.setHeader('X-RateLimit-Reset', new Date(now + config.windowMs).toISOString());

      next();
    } catch (error) {
      console.error('[Rate Limit] Error:', error);
      // Don't block request on rate limiter error
      next();
    }
  };
}

/**
 * Get client IP address (handle proxies)
 */
function getClientIp(req: Request): string | null {
  // Check X-Forwarded-For header (set by proxies)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  // Check X-Real-IP header
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fall back to socket address
  return req.socket.remoteAddress || null;
}

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
export const authRateLimiter = createIpRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,            // 5 attempts
  blockDurationMs: 60 * 60 * 1000 // Block for 1 hour
});

/**
 * Strict rate limiter for payment endpoints
 * Prevents payment fraud
 */
export const paymentRateLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 3,            // 3 requests
  blockDurationMs: 5 * 60 * 1000 // Block for 5 minutes
});

/**
 * Strict rate limiter for withdrawal endpoints
 * Prevents withdrawal fraud
 */
export const withdrawalRateLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 2,            // 2 requests
  blockDurationMs: 10 * 60 * 1000 // Block for 10 minutes
});

/**
 * Moderate rate limiter for API endpoints
 */
export const apiRateLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 60,           // 60 requests
  blockDurationMs: 5 * 60 * 1000 // Block for 5 minutes
});

/**
 * Strict rate limiter for voting endpoints
 * Prevents vote manipulation
 */
export const votingRateLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 10,           // 10 votes
  blockDurationMs: 5 * 60 * 1000 // Block for 5 minutes
});

/**
 * Progressive rate limiter with increasing delays
 * Implements exponential backoff for repeated violations
 */
export function createProgressiveRateLimiter(baseConfig: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = getClientIp(req);
      if (!ip) {
        next();
        return;
      }

      const violationKey = `rate_limit:violations:${ip}`;
      const violations = parseInt(await redis.get(violationKey) || '0');

      // Calculate progressive delay
      const delay = Math.min(violations * 1000, 30000); // Max 30 seconds

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Apply base rate limiter
      const limiter = createIpRateLimiter(baseConfig);
      
      // Wrap next to track violations
      const wrappedNext = () => {
        // Reset violations on successful request
        redis.del(violationKey);
        next();
      };

      // Override res.status to track violations
      const originalStatus = res.status.bind(res);
      res.status = function(code: number) {
        if (code === 429) {
          // Increment violations
          redis.incr(violationKey);
          redis.expire(violationKey, 3600); // 1 hour
        }
        return originalStatus(code);
      };

      limiter(req, res, wrappedNext);
    } catch (error) {
      console.error('[Progressive Rate Limit] Error:', error);
      next();
    }
  };
}

/**
 * Whitelist IPs (for webhooks, trusted services)
 */
export function createWhitelistMiddleware(whitelist: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getClientIp(req);
    
    if (!ip) {
      res.status(403).json({ 
        error: 'Could not determine client IP',
        code: 'IP_REQUIRED'
      });
      return;
    }

    if (!whitelist.includes(ip)) {
      res.status(403).json({ 
        error: 'IP not whitelisted',
        code: 'IP_NOT_WHITELISTED'
      });
      return;
    }

    next();
  };
}

/**
 * PayPal webhook IP whitelist
 * Source: https://developer.paypal.com/api/nvp-soap/ipn/IPNIntro/#ipn-protocol-and-architecture
 */
export const paypalWebhookWhitelist = createWhitelistMiddleware([
  '173.0.80.0/20',
  '64.4.240.0/20',
  '66.211.168.0/22',
  '216.113.160.0/23',
  '216.113.188.0/23'
  // Add more PayPal IPs as needed
]);

/**
 * Paystack webhook IP whitelist
 * Source: https://paystack.com/docs/payments/webhooks/#ip-whitelisting
 */
export const paystackWebhookWhitelist = createWhitelistMiddleware([
  '52.31.139.75',
  '52.49.173.169',
  '52.214.14.220'
]);

/**
 * M-Pesa webhook IP whitelist
 * Source: Safaricom Daraja API documentation
 */
export const mpesaWebhookWhitelist = createWhitelistMiddleware([
  '196.201.214.200',
  '196.201.214.206',
  '196.201.213.114',
  '196.201.214.207',
  '196.201.214.208',
  '196.201.213.44',
  '196.201.212.127',
  '196.201.212.138',
  '196.201.212.129',
  '196.201.212.136',
  '196.201.212.74'
]);
