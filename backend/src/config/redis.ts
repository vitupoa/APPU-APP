import Redis from 'ioredis';
import { env } from './env.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  });

// Cache helpers
export const CACHE_TTL = {
  EXCHANGE_RATES: 300,       // 5 minutes
  USER_PROFILE: 60,          // 1 minute
  FEED_PAGE: 30,             // 30 seconds
  LEADERBOARD: 15,           // 15 seconds
  WALLET_BALANCE: 10,        // 10 seconds
} as const;
