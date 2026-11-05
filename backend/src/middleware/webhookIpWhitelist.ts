import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

/**
 * Webhook IP Whitelisting Middleware
 * 
 * Verifies that webhook requests come from trusted payment provider IPs
 * 
 * SECURITY: Blocks malicious webhook spoofing attempts
 */

// Official PayPal webhook IPs (as of 2024)
// Source: https://developer.paypal.com/api/nvp-soap/ipn/IPNIntro/#ipn-protocol-and-architecture
const PAYPAL_IPS = [
  '173.0.80.0/20',      // 173.0.80.0 - 173.0.95.255
  '64.4.240.0/20',      // 64.4.240.0 - 64.4.255.255
  '66.211.160.0/19',    // 66.211.160.0 - 66.211.191.255
  '216.113.160.0/19',   // 216.113.160.0 - 216.113.191.255
  '216.113.128.0/19',   // 216.113.128.0 - 216.113.159.255
  '66.211.128.0/18',    // 66.211.128.0 - 66.211.191.255
];

// Paystack webhook IPs
// Source: https://paystack.com/docs/payments/webhooks/#ip-whitelisting
const PAYSTACK_IPS = [
  '52.31.139.75',
  '52.49.173.169',
  '52.214.14.220',
];

// M-Pesa (Safaricom) webhook IPs
// These are typical ranges - verify with Safaricom documentation
const MPESA_IPS = [
  '196.201.214.0/24',   // Safaricom range
  '196.201.213.0/24',   // Safaricom range
];

// Stripe webhook IPs (if you add Stripe)
// Source: https://stripe.com/docs/ips
const STRIPE_IPS = [
  '3.18.12.63',
  '3.130.192.231',
  '13.235.14.237',
  '13.235.122.149',
  // ... add more from Stripe's IP list
];

/**
 * Check if an IP is within a CIDR range
 */
function isIpInCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes('/')) {
    // Exact IP match
    return ip === cidr;
  }

  const [range, bits] = cidr.split('/');
  const mask = -1 << (32 - parseInt(bits));
  
  const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  const rangeNum = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  
  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * Check if IP is whitelisted for a specific provider
 */
function isIpWhitelisted(ip: string, provider: 'paypal' | 'paystack' | 'mpesa' | 'stripe'): boolean {
  const ipLists: Record<string, string[]> = {
    paypal: PAYPAL_IPS,
    paystack: PAYSTACK_IPS,
    mpesa: MPESA_IPS,
    stripe: STRIPE_IPS,
  };

  const allowedIps = ipLists[provider];
  if (!allowedIps) return false;

  return allowedIps.some(range => isIpInCidr(ip, range));
}

/**
 * Extract real IP from request (handles proxies)
 */
function getRealIp(req: Request): string {
  // Check X-Forwarded-For (Railway, Cloudflare, nginx)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim(); // First IP is the original client
  }

  // Check X-Real-IP (nginx)
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return typeof realIp === 'string' ? realIp : realIp[0];
  }

  // Fallback to req.ip
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Webhook IP Whitelisting Middleware Factory
 * 
 * @param provider - Payment provider name
 * @returns Express middleware function
 * 
 * @example
 * app.post('/webhook/paypal', webhookIpWhitelist('paypal'), handlePayPalWebhook);
 */
export function webhookIpWhitelist(provider: 'paypal' | 'paystack' | 'mpesa' | 'stripe') {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip in development mode if explicitly disabled
    if (env.NODE_ENV === 'development' && env.SKIP_WEBHOOK_IP_CHECK === 'true') {
      next();
      return;
    }

    const clientIp = getRealIp(req);

    // Check if IP is whitelisted
    if (!isIpWhitelisted(clientIp, provider)) {
      // Log security incident
      console.error(`[SECURITY] Webhook IP blocked: ${clientIp} attempted ${provider} webhook`);

      res.status(403).json({
        error: 'Forbidden',
        message: 'IP not whitelisted for webhook access'
      });
      return;
    }

    // IP is whitelisted, proceed
    next();
  };
}

/**
 * Development/Testing: Add custom IPs to whitelist
 * 
 * SECURITY: Only use in development/staging environments
 */
export function addDevWebhookIp(ip: string, provider: 'paypal' | 'paystack' | 'mpesa' | 'stripe'): void {
  if (env.NODE_ENV === 'production') {
    throw new Error('Cannot add development IPs in production');
  }

  const ipLists: Record<string, string[]> = {
    paypal: PAYPAL_IPS,
    paystack: PAYSTACK_IPS,
    mpesa: MPESA_IPS,
    stripe: STRIPE_IPS,
  };

  ipLists[provider].push(ip);
}
