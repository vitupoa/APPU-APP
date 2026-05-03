import rateLimit from 'express-rate-limit';
import { Redis } from 'ioredis';
import { RedisStore } from 'rate-limit-redis';

// Railway provides REDIS_URL directly — use it as-is, no db override
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

function makeStore(prefix: string) {
  return new RedisStore({
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as any,
    prefix,
  });
}

const keyGen = (req: any): string => (req.userId ?? req.ip ?? 'unknown') as string;
const skipAdmin = (req: any): boolean => req.user?.isAdmin === true;

export const unlockRateLimiter = rateLimit({
  store: makeStore('rl:unlock:'),
  windowMs: 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: keyGen, skip: skipAdmin,
  handler: (_req, res) => res.status(429).json({ error: 'Too many unlock attempts', retryAfter: 60 }),
});

export const subscriptionRateLimiter = rateLimit({
  store: makeStore('rl:subscription:'),
  windowMs: 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: keyGen, skip: skipAdmin,
  handler: (_req, res) => res.status(429).json({ error: 'Too many subscription attempts', retryAfter: 60 }),
});

export const conversionRateLimiter = rateLimit({
  store: makeStore('rl:conversion:'),
  windowMs: 60 * 1000, max: 30,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: keyGen, skip: skipAdmin,
});

export const accessCheckRateLimiter = rateLimit({
  store: makeStore('rl:access:'),
  windowMs: 60 * 1000, max: 100,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: keyGen, skip: skipAdmin,
});

export const failedUnlockRateLimiter = rateLimit({
  store: makeStore('rl:unlock:failed:'),
  windowMs: 15 * 60 * 1000, max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: keyGen, skip: skipAdmin,
  handler: (_req, res) => res.status(429).json({ error: 'Account temporarily locked', retryAfter: 900 }),
});

export const globalRateLimiter = rateLimit({
  store: makeStore('rl:global:'),
  windowMs: 15 * 60 * 1000, max: 1000,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: keyGen, skip: skipAdmin,
});

export const walletRateLimiter = rateLimit({
  store: makeStore('rl:wallet:'),
  windowMs: 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: keyGen, skip: skipAdmin,
});

export async function incrementRateLimitCounter(prefix: string, key: string, windowMs = 60000): Promise<void> {
  const redisKey = `${prefix}${key}`;
  await redis.incr(redisKey);
  await redis.expire(redisKey, Math.ceil(windowMs / 1000));
}

export async function getRateLimitStatus(prefix: string, key: string) {
  const redisKey = `${prefix}${key}`;
  const current = parseInt((await redis.get(redisKey)) || '0');
  const ttl = await redis.ttl(redisKey);
  const limits: Record<string, number> = {
    'rl:unlock:': 10, 'rl:subscription:': 5, 'rl:conversion:': 30,
    'rl:access:': 100, 'rl:wallet:': 20,
  };
  const limit = limits[prefix] || 100;
  return { current, limit, remaining: Math.max(0, limit - current), resetAt: new Date(Date.now() + ttl * 1000) };
}

export async function resetRateLimit(prefix: string, key: string): Promise<void> {
  await redis.del(`${prefix}${key}`);
}

export { redis };
