import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';

// Initialize Redis client for rate limiting
// Supports both Railway Redis URL and individual connection parameters
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      db: parseInt(process.env.REDIS_RATE_LIMIT_DB || '1'),
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_RATE_LIMIT_DB || '1'),
    });

/**
 * Rate limiter for content unlock operations
 * Prevents spam and abuse of unlock functionality
 */
export const unlockRateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:unlock:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 unlock attempts per minute per user
  message: {
    error: 'Too many unlock attempts. Please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit per user
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for admins
    return req.user?.isAdmin === true;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many unlock attempts',
      message: 'You have exceeded the unlock rate limit. Please try again in 1 minute.',
      retryAfter: 60,
    });
  },
});

/**
 * Rate limiter for subscription operations
 * Prevents spam and abuse of subscription functionality
 */
export const subscriptionRateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:subscription:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 subscription operations per minute per user
  message: {
    error: 'Too many subscription attempts. Please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    return req.user?.isAdmin === true;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many subscription attempts',
      message: 'You have exceeded the subscription rate limit. Please try again in 1 minute.',
      retryAfter: 60,
    });
  },
});

/**
 * Rate limiter for price conversion requests
 * Prevents abuse of currency conversion API
 */
export const conversionRateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:conversion:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 conversion requests per minute per user
  message: {
    error: 'Too many conversion requests. Please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    return req.user?.isAdmin === true;
  },
});

/**
 * Rate limiter for access check requests
 * Prevents abuse of access check API
 */
export const accessCheckRateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:access:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 access checks per minute per user
  message: {
    error: 'Too many access check requests. Please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    return req.user?.isAdmin === true;
  },
});

/**
 * Aggressive rate limiter for failed unlock attempts
 * Triggers after multiple failed attempts to prevent brute force
 */
export const failedUnlockRateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:unlock:failed:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts per 15 minutes
  skipSuccessfulRequests: true, // Only count failed requests
  message: {
    error: 'Too many failed unlock attempts. Account temporarily locked.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    return req.user?.isAdmin === true;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Account temporarily locked',
      message: 'Too many failed unlock attempts. Please try again in 15 minutes or contact support.',
      retryAfter: 900,
    });
  },
});

/**
 * Global API rate limiter
 * Applies to all API endpoints as a baseline protection
 */
export const globalRateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:global:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes per user
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    return req.user?.isAdmin === true;
  },
});

/**
 * Rate limiter for wallet operations
 * Prevents rapid wallet manipulation attempts
 */
export const walletRateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:wallet:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 wallet operations per minute
  message: {
    error: 'Too many wallet operations. Please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    return req.user?.isAdmin === true;
  },
});

/**
 * Helper function to manually increment rate limit counter
 * Useful for tracking failed attempts
 */
export async function incrementRateLimitCounter(
  prefix: string,
  key: string,
  windowMs: number = 60000
): Promise<void> {
  const redisKey = `${prefix}${key}`;
  const ttl = Math.ceil(windowMs / 1000);
  
  await redis.incr(redisKey);
  await redis.expire(redisKey, ttl);
}

/**
 * Helper function to check current rate limit status
 * Returns remaining requests and reset time
 */
export async function getRateLimitStatus(
  prefix: string,
  key: string
): Promise<{ current: number; limit: number; remaining: number; resetAt: Date }> {
  const redisKey = `${prefix}${key}`;
  const current = parseInt(await redis.get(redisKey) || '0');
  const ttl = await redis.ttl(redisKey);
  
  // These limits should match the rate limiter configurations
  const limits: Record<string, number> = {
    'rl:unlock:': 10,
    'rl:subscription:': 5,
    'rl:conversion:': 30,
    'rl:access:': 100,
    'rl:wallet:': 20,
  };
  
  const limit = limits[prefix] || 100;
  const remaining = Math.max(0, limit - current);
  const resetAt = new Date(Date.now() + (ttl * 1000));
  
  return { current, limit, remaining, resetAt };
}

/**
 * Helper function to reset rate limit for a specific key
 * Useful for admin operations or after resolving issues
 */
export async function resetRateLimit(prefix: string, key: string): Promise<void> {
  const redisKey = `${prefix}${key}`;
  await redis.del(redisKey);
}

// Export Redis client for other uses
export { redis };
