import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller.js';
import express from 'express';

const router = Router();

// PayPal webhooks and redirects
router.post('/paypal', express.raw({ type: 'application/json' }), WebhookController.handlePayPalWebhook);
router.get('/paypal/success', WebhookController.handlePayPalSuccess);
router.get('/paypal/cancel', WebhookController.handlePayPalCancel);

// Paystack webhooks and redirects
router.post('/paystack', express.json(), WebhookController.handlePaystackWebhook);
router.get('/paystack/callback', WebhookController.handlePaystackCallback);

export default router;
