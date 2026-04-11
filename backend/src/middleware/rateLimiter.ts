import rateLimit from 'express-rate-limit';

import { env } from '../config/env';

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, 
  max: env.RATE_LIMIT_MAX,                  
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Stricter limits for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts' },
});

// Stricter limits for payment endpoints
export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 5,
  message: { error: 'Too many payment requests' },
});
