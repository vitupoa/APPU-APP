import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller.js';
import express from 'express';
import { 
  paypalWebhookWhitelist,
  paystackWebhookWhitelist,
  mpesaWebhookWhitelist
} from '../middleware/ipRateLimiter.js';

const router = Router();

// SECURITY: PayPal webhooks with IP whitelisting
router.post('/paypal', 
  paypalWebhookWhitelist,
  express.raw({ type: 'application/json' }), 
  WebhookController.handlePayPalWebhook
);
router.get('/paypal/success', WebhookController.handlePayPalSuccess);
router.get('/paypal/cancel', WebhookController.handlePayPalCancel);

// SECURITY: Paystack webhooks with IP whitelisting
router.post('/paystack', 
  paystackWebhookWhitelist,
  express.json(), 
  WebhookController.handlePaystackWebhook
);
router.get('/paystack/callback', WebhookController.handlePaystackCallback);

// SECURITY: M-Pesa callback with IP whitelisting
router.post('/mpesa/callback', 
  mpesaWebhookWhitelist,
  express.json(), 
  WebhookController.handleMpesaCallback
);

export default router;
