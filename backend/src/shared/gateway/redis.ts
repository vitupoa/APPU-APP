import { Redis } from 'ioredis';
import { env } from '../../config/env';

export const pubClient = new Redis(env.REDIS_URL);
export const subClient = pubClient.duplicate();

pubClient.on('error', (err) => {
  console.error('[Redis PubClient] Error:', err);
});

subClient.on('error', (err) => {
  console.error('[Redis SubClient] Error:', err);
});

export const RedisChannels = {
  NOTIFICATIONS: 'krieta:notifications',
  MILESTONES: 'krieta:milestones',
  CONTEST_RACE: 'krieta:contests', // Used for race conditions/leaderboard gateways
} as const;
