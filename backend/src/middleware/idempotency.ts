import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import crypto from 'crypto';

/**
 * Idempotency Middleware
 * 
 * Prevents duplicate financial transactions by tracking idempotency keys.
 * Critical for:
 * - Wallet top-ups
 * - Withdrawals
 * - Tips
 * - Contest prize distributions
 * - Any financial operation
 */

interface IdempotentRequest extends Request {
  idempotencyKey?: string;
  userId?: string;
}

// Store for in-flight requests (prevents concurrent duplicates)
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Idempotency key model (add to schema.prisma):
 * 
 * model IdempotencyKey {
 *   id            String   @id @default(uuid())
 *   key           String   @unique
 *   userId        String   @map("user_id")
 *   requestPath   String   @map("request_path")
 *   requestMethod String   @map("request_method")
 *   requestBody   Json?    @map("request_body")
 *   responseCode  Int      @map("response_code")
 *   responseBody  Json     @map("response_body")
 *   createdAt     DateTime @default(now()) @map("created_at")
 *   expiresAt     DateTime @map("expires_at")
 * 
 *   @@index([expiresAt])
 *   @@index([userId, createdAt])
 *   @@map("idempotency_keys")
 * }
 */

/**
 * Generate idempotency key from request
 */
function generateIdempotencyKey(req: IdempotentRequest): string {
  const userId = req.userId || 'anonymous';
  const path = req.path;
  const method = req.method;
  const body = JSON.stringify(req.body);
  
  return crypto
    .createHash('sha256')
    .update(`${userId}:${method}:${path}:${body}`)
    .digest('hex');
}

/**
 * Idempotency middleware for financial operations
 */
export function idempotencyMiddleware(options: {
  ttlSeconds?: number;
  autoGenerate?: boolean;
} = {}) {
  const ttlSeconds = options.ttlSeconds || 86400; // 24 hours default
  const autoGenerate = options.autoGenerate !== false;

  return async (req: IdempotentRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get idempotency key from header or generate from request
      let idempotencyKey = req.headers['idempotency-key'] as string;
      
      if (!idempotencyKey && autoGenerate) {
        idempotencyKey = generateIdempotencyKey(req);
      }
      
      if (!idempotencyKey) {
        res.status(400).json({ error: 'Idempotency-Key header required for this operation', code: 'IDEMPOTENCY_KEY_REQUIRED' });
        return;
      }

      // Validate idempotency key format (UUID or hex string)
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(idempotencyKey) &&
          !/^[a-f0-9]{64}$/i.test(idempotencyKey)) {
        res.status(400).json({ error: 'Invalid Idempotency-Key format. Must be UUID or 64-char hex string', code: 'INVALID_IDEMPOTENCY_KEY' });
        return;
      }

      req.idempotencyKey = idempotencyKey;

      // Check if this request is already in-flight
      const inFlightPromise = inFlightRequests.get(idempotencyKey);
      if (inFlightPromise) {
        const result = await inFlightPromise;
        res.status(result.code).json(result.body);
        return;
      }

      // Check if we've seen this idempotency key before
      const existing = await prisma.$queryRaw<any[]>`
        SELECT response_code, response_body, created_at
        FROM idempotency_keys
        WHERE key = ${idempotencyKey}
        AND expires_at > NOW()
        LIMIT 1
      `;

      if (existing && existing.length > 0) {
        const record = existing[0];
        res.status(record.response_code).json(record.response_body);
        return;
      }

      // Store original res.json to intercept response
      const originalJson = res.json.bind(res);
      const originalStatus = res.status.bind(res);
      
      let statusCode = 200;
      let responseBody: any;

      // Override res.status to capture status code
      res.status = function(code: number) {
        statusCode = code;
        return originalStatus(code);
      };

      // Override res.json to capture response and store idempotency record
      res.json = function(body: any) {
        responseBody = body;

        // Only store successful responses (2xx)
        if (statusCode >= 200 && statusCode < 300) {
          const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
          prisma.$executeRaw`
              INSERT INTO idempotency_keys (
                id, key, user_id, request_path, request_method, 
                request_body, response_code, response_body, expires_at, created_at
              ) VALUES (
                gen_random_uuid(),
                ${idempotencyKey},
                ${req.userId || 'anonymous'},
                ${req.path},
                ${req.method},
                ${JSON.stringify(req.body)}::jsonb,
                ${statusCode},
                ${JSON.stringify(responseBody)}::jsonb,
                ${expiresAt},
                NOW()
              )
              ON CONFLICT (key) DO NOTHING
            `.catch((error: any) => console.error('Failed to store idempotency key:', error));
        }

        inFlightRequests.delete(idempotencyKey!);
        return originalJson(body);
      };

      // Create promise for in-flight tracking
      const requestPromise = new Promise((resolve) => {
        res.on('finish', () => {
          resolve({ code: statusCode, body: responseBody });
        });
      });

      inFlightRequests.set(idempotencyKey, requestPromise);

      next();
    } catch (error: any) {
      console.error('Idempotency middleware error:', error);
      res.status(500).json({ error: 'Internal server error', code: 'IDEMPOTENCY_ERROR' });
    }
  };
}

/**
 * Cleanup expired idempotency keys (run as cron job)
 */
export async function cleanupExpiredIdempotencyKeys() {
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM idempotency_keys
      WHERE expires_at < NOW()
    `;
    
    console.log(`Cleaned up ${result} expired idempotency keys`);
    return result;
  } catch (error) {
    console.error('Failed to cleanup idempotency keys:', error);
    throw error;
  }
}

/**
 * Get idempotency key statistics
 */
export async function getIdempotencyStats() {
  const stats = await prisma.$queryRaw<any[]>`
    SELECT 
      COUNT(*) as total_keys,
      COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_keys,
      COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_keys,
      MIN(created_at) as oldest_key,
      MAX(created_at) as newest_key
    FROM idempotency_keys
  `;
  
  return stats[0];
}
