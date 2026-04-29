import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Request Signature Validation Middleware
 * Validates HMAC-SHA256 signatures on incoming requests to prevent tampering
 */

interface SignedRequest extends Request {
  signatureValid?: boolean;
  signatureTimestamp?: number;
}

/**
 * Generate HMAC-SHA256 signature for request
 */
export function generateSignature(
  method: string,
  path: string,
  timestamp: number,
  body: string = ''
): string {
  const payload = `${method}|${path}|${timestamp}|${body}`;
  
  return crypto
    .createHmac('sha256', env.REQUEST_SIGNING_KEY)
    .update(payload)
    .digest('hex');
}

/**
 * Verify request signature
 */
function verifySignature(
  signature: string,
  method: string,
  path: string,
  timestamp: number,
  body: string = ''
): boolean {
  const expectedSignature = generateSignature(method, path, timestamp, body);
  
  // Timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Request Signature Validation Middleware
 * Validates X-Signature and X-Timestamp headers
 */
export function requestSignatureValidation(
  req: SignedRequest,
  res: Response,
  next: NextFunction
): void {
  // Skip signature validation for health check and public endpoints
  const publicPaths = ['/health', '/api/v1/auth/login', '/api/v1/auth/register'];
  if (publicPaths.includes(req.path)) {
    next();
    return;
  }

  const signature = req.headers['x-signature'] as string;
  const timestamp = req.headers['x-timestamp'] as string;

  if (!signature || !timestamp) {
    res.status(401).json({
      error: 'Missing request signature',
      code: 'SIGNATURE_MISSING',
      message: 'X-Signature and X-Timestamp headers are required'
    });
    return;
  }

  const requestTimestamp = parseInt(timestamp, 10);
  
  // Check timestamp is valid number
  if (isNaN(requestTimestamp)) {
    res.status(401).json({
      error: 'Invalid timestamp',
      code: 'INVALID_TIMESTAMP'
    });
    return;
  }

  // Check timestamp is within 5 minutes (prevent replay attacks)
  const now = Date.now();
  const timeDiff = Math.abs(now - requestTimestamp);
  const maxTimeDiff = 5 * 60 * 1000; // 5 minutes

  if (timeDiff > maxTimeDiff) {
    res.status(401).json({
      error: 'Request timestamp expired',
      code: 'TIMESTAMP_EXPIRED',
      message: 'Request must be made within 5 minutes'
    });
    return;
  }

  // Get request body as string
  const bodyString = req.body ? JSON.stringify(req.body) : '';
  
  // Verify signature
  const isValid = verifySignature(
    signature,
    req.method,
    req.path,
    requestTimestamp,
    bodyString
  );

  if (!isValid) {
    res.status(401).json({
      error: 'Invalid request signature',
      code: 'INVALID_SIGNATURE',
      message: 'Request signature verification failed'
    });
    return;
  }

  // Attach signature info to request
  req.signatureValid = true;
  req.signatureTimestamp = requestTimestamp;

  next();
}

/**
 * Optional signature validation (warns but doesn't block)
 * Use for gradual rollout
 */
export function optionalSignatureValidation(
  req: SignedRequest,
  res: Response,
  next: NextFunction
): void {
  const signature = req.headers['x-signature'] as string;
  const timestamp = req.headers['x-timestamp'] as string;

  if (!signature || !timestamp) {
    console.warn(`[Signature Warning] Missing signature for ${req.method} ${req.path}`);
    next();
    return;
  }

  const requestTimestamp = parseInt(timestamp, 10);
  if (isNaN(requestTimestamp)) {
    console.warn(`[Signature Warning] Invalid timestamp for ${req.method} ${req.path}`);
    next();
    return;
  }

  const bodyString = req.body ? JSON.stringify(req.body) : '';
  const isValid = verifySignature(
    signature,
    req.method,
    req.path,
    requestTimestamp,
    bodyString
  );

  if (!isValid) {
    console.warn(`[Signature Warning] Invalid signature for ${req.method} ${req.path}`);
  }

  req.signatureValid = isValid;
  req.signatureTimestamp = requestTimestamp;

  next();
}

/**
 * Signature validation for webhooks (external services)
 */
export function webhookSignatureValidation(secretKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const signature = req.headers['x-webhook-signature'] as string;
    const timestamp = req.headers['x-webhook-timestamp'] as string;

    if (!signature || !timestamp) {
      res.status(401).json({
        error: 'Missing webhook signature',
        code: 'WEBHOOK_SIGNATURE_MISSING'
      });
      return;
    }

    const requestTimestamp = parseInt(timestamp, 10);
    const bodyString = req.body ? JSON.stringify(req.body) : '';
    
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(`${timestamp}|${bodyString}`)
      .digest('hex');

    try {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!isValid) {
        res.status(401).json({
          error: 'Invalid webhook signature',
          code: 'INVALID_WEBHOOK_SIGNATURE'
        });
        return;
      }

      next();
    } catch {
      res.status(401).json({
        error: 'Webhook signature verification failed',
        code: 'WEBHOOK_VERIFICATION_FAILED'
      });
    }
  };
}

/**
 * Generate signature for client (helper for testing)
 */
export function generateClientSignature(
  method: string,
  path: string,
  body?: any
): { signature: string; timestamp: number } {
  const timestamp = Date.now();
  const bodyString = body ? JSON.stringify(body) : '';
  const signature = generateSignature(method, path, timestamp, bodyString);

  return { signature, timestamp };
}
