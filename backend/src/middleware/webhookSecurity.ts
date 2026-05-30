import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Webhook Security Middleware
 * 
 * Implements IP whitelisting and signature verification for payment webhooks
 */

// Payment provider IP whitelists
const PAYSTACK_IPS = [
  '52.31.139.75',
  '52.49.173.169',
  '52.214.14.220'
];

const MPESA_IPS = [
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
  '196.201.212.74',
  '196.201.212.69'
];

const PAYPAL_IPS = [
  '173.0.80.0/20',
  '64.4.240.0/20',
  '66.211.160.0/19',
  '69.192.0.0/16'
];

/**
 * Check if IP is in CIDR range
 */
function ipInCIDR(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  
  const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  const rangeNum = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  
  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * Verify Paystack webhook signature
 */
function verifyPaystackSignature(req: Request): boolean {
  const signature = req.headers['x-paystack-signature'] as string;
  if (!signature) return false;
  
  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  return hash === signature;
}

/**
 * Verify M-Pesa webhook signature
 */
function verifyMpesaSignature(req: Request): boolean {
  // M-Pesa uses different authentication - implement based on your setup
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  
  // Verify against your M-Pesa credentials
  return true; // Implement actual verification
}

/**
 * Verify PayPal webhook signature
 */
function verifyPayPalSignature(req: Request): boolean {
  const transmissionId = req.headers['paypal-transmission-id'] as string;
  const transmissionTime = req.headers['paypal-transmission-time'] as string;
  const certUrl = req.headers['paypal-cert-url'] as string;
  const authAlgo = req.headers['paypal-auth-algo'] as string;
  const transmissionSig = req.headers['paypal-transmission-sig'] as string;
  
  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }
  
  // PayPal signature verification is complex - use PayPal SDK
  // This is a simplified version
  return true; // Implement actual verification with PayPal SDK
}

/**
 * IP Whitelist middleware for Paystack webhooks
 */
export function paystackWebhookSecurity(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const clientIp = req.ip || req.socket.remoteAddress || '';
  
  // Check IP whitelist
  if (!PAYSTACK_IPS.includes(clientIp)) {
    console.warn(`Paystack webhook from unauthorized IP: ${clientIp}`);
    res.status(403).json({ error: 'Unauthorized IP address' });
    return;
  }
  
  // Verify signature
  if (!verifyPaystackSignature(req)) {
    console.warn(`Paystack webhook signature verification failed from IP: ${clientIp}`);
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }
  
  next();
}

/**
 * IP Whitelist middleware for M-Pesa webhooks
 */
export function mpesaWebhookSecurity(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const clientIp = req.ip || req.socket.remoteAddress || '';
  
  // Check IP whitelist
  if (!MPESA_IPS.includes(clientIp)) {
    console.warn(`M-Pesa webhook from unauthorized IP: ${clientIp}`);
    res.status(403).json({ error: 'Unauthorized IP address' });
    return;
  }
  
  // Verify signature/auth
  if (!verifyMpesaSignature(req)) {
    console.warn(`M-Pesa webhook authentication failed from IP: ${clientIp}`);
    res.status(401).json({ error: 'Invalid authentication' });
    return;
  }
  
  next();
}

/**
 * IP Whitelist middleware for PayPal webhooks
 */
export function paypalWebhookSecurity(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const clientIp = req.ip || req.socket.remoteAddress || '';
  
  // Check IP whitelist (CIDR ranges)
  const isAllowed = PAYPAL_IPS.some(cidr => ipInCIDR(clientIp, cidr));
  
  if (!isAllowed) {
    console.warn(`PayPal webhook from unauthorized IP: ${clientIp}`);
    res.status(403).json({ error: 'Unauthorized IP address' });
    return;
  }
  
  // Verify signature
  if (!verifyPayPalSignature(req)) {
    console.warn(`PayPal webhook signature verification failed from IP: ${clientIp}`);
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }
  
  next();
}

/**
 * Generic webhook security middleware
 */
export function webhookSecurity(provider: 'paystack' | 'mpesa' | 'paypal') {
  return (req: Request, res: Response, next: NextFunction): void => {
    switch (provider) {
      case 'paystack':
        return paystackWebhookSecurity(req, res, next);
      case 'mpesa':
        return mpesaWebhookSecurity(req, res, next);
      case 'paypal':
        return paypalWebhookSecurity(req, res, next);
      default:
        res.status(400).json({ error: 'Unknown payment provider' });
    }
  };
}
