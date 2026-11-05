import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller.js';
import express from 'express';
import { webhookIpWhitelist } from '../middleware/webhookIpWhitelist.js';

const router = Router();

// SECURITY: PayPal webhooks with IP whitelisting
router.post('/paypal', 
  webhookIpWhitelist('paypal'),
  express.raw({ type: 'application/json' }), 
  WebhookController.handlePayPalWebhook
);
router.get('/paypal/success', WebhookController.handlePayPalSuccess);
router.get('/paypal/cancel', WebhookController.handlePayPalCancel);

// SECURITY: Paystack webhooks with IP whitelisting
router.post('/paystack', 
  webhookIpWhitelist('paystack'),
  express.json(), 
  WebhookController.handlePaystackWebhook
);
router.get('/paystack/callback', WebhookController.handlePaystackCallback);

// SECURITY: M-Pesa callback with IP whitelisting
router.post('/mpesa/callback', 
  webhookIpWhitelist('mpesa'),
  express.json(), 
  WebhookController.handleMpesaCallback
);

export default router;
