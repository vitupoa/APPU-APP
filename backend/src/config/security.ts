import helmet from 'helmet';
import cors from 'cors';
import { env } from './env.js';

/**
 * Security Headers Configuration
 * 
 * Implements comprehensive security headers to protect against:
 * - XSS attacks
 * - Clickjacking
 * - MIME sniffing
 * - Information leakage
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'https://res.cloudinary.com'],
      frameSrc: ["'none'"],
    },
  },
  
  // Strict Transport Security (HTTPS only)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // Prevent clickjacking
  frameguard: {
    action: 'deny',
  },
  
  // Prevent MIME sniffing
  noSniff: true,
  
  // XSS Protection
  xssFilter: true,
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  
  // Permissions Policy (formerly Feature Policy)
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },
});

/**
 * CORS Configuration
 * 
 * Securely configure Cross-Origin Resource Sharing
 */
export const corsConfig = cors({
  // Allow specific origins (never use '*' in production)
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // In production, only allow specific origins
    if (env.NODE_ENV === 'production') {
      const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all origins
      callback(null, true);
    }
  },
  
  // Allow credentials (cookies, authorization headers)
  credentials: true,
  
  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  
  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-Request-ID',
    'Idempotency-Key',
    'X-Device-ID',
    'X-App-Version',
  ],
  
  // Exposed headers (accessible to frontend)
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Total-Count',
  ],
  
  // Preflight cache duration (24 hours)
  maxAge: 86400,
  
  // Pass CORS preflight response to next handler
  preflightContinue: false,
  
  // Provide a status code for successful OPTIONS requests
  optionsSuccessStatus: 204,
});

/**
 * Additional Security Headers Middleware
 */
export function additionalSecurityHeaders(req: any, res: any, next: any) {
  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  // Prevent caching of sensitive data
  if (req.path.includes('/api/v1/wallet') || 
      req.path.includes('/api/v1/payments') ||
      req.path.includes('/api/v1/kyc') ||
      req.path.includes('/api/v1/auth') || {    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Add request ID for tracing
  const requestId = req.requestId || Math.random().toString(36).substring(7);
  res.setHeader('X-Request-ID', requestId);
  
  next();
}
