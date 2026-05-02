import { Request, Response } from 'express';
import { WalletService } from '../modules/wallet/wallet.service.js';
import PayPalService from '../services/payment/paypal.service.js';
import PaystackService from '../services/payment/paystack.service.js';
import { prisma } from '../config/database.js';
import { Prisma } from '../generated/prisma/client.js';

export class WebhookController {
  /**
   * PayPal webhook handler
   */
  static async handlePayPalWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Verify webhook signature
      const isValid = await PayPalService.verifyWebhook(req.headers, req.body);
      
      if (!isValid) {
        console.error('Invalid PayPal webhook signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const event = req.body;
      const eventType = event.event_type;

      console.log(`PayPal webhook received: ${eventType}`);

      // Handle payment capture completed
      if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
        const resource = event.resource;
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        const reference = resource.custom_id || resource.invoice_id;

        // Find transaction by PayPal order ID
        const transaction = await prisma.transaction.findFirst({
          where: {
            reference: { contains: reference },
            status: 'pending',
            provider: 'paypal'
          }
        });

        if (transaction) {
          await WalletService.confirmTopup(transaction.userId, transaction.id, orderId);
          console.log(`✅ PayPal payment confirmed for transaction ${transaction.id}`);
        }
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('PayPal webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Paystack webhook handler
   */
  static async handlePaystackWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Verify webhook signature
      const signature = req.headers['x-paystack-signature'] as string;
      const payload = JSON.stringify(req.body);
      
      const isValid = PaystackService.verifyWebhookSignature(payload, signature);
      
      if (!isValid) {
        console.error('Invalid Paystack webhook signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const event = req.body;
      const eventType = event.event;

      console.log(`Paystack webhook received: ${eventType}`);

      // Handle charge success
      if (eventType === 'charge.success') {
        const data = event.data;
        const reference = data.reference;
        const channel = data.channel; // card, bank, ussd, mobile_money, etc.

        // Find transaction by reference
        const transaction = await prisma.transaction.findFirst({
          where: {
            reference,
            status: 'pending',
            provider: 'paystack'
          }
        });

        if (transaction) {
          // Update metadata with payment channel
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              metadata: {
                ...(transaction.metadata as any),
                paymentChannel: channel,
                paystackTransactionId: data.id
              }
            }
          });

          await WalletService.confirmTopup(transaction.userId, transaction.id, reference);
          console.log(`✅ Paystack payment confirmed for transaction ${transaction.id} via ${channel}`);
        }
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Paystack webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PayPal success redirect handler
   */
  static async handlePayPalSuccess(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query; // PayPal order ID
      
      if (!token) {
        res.status(400).send('Missing order ID');
        return;
      }

      // Capture the payment
      const captureResult = await PayPalService.captureOrder(token as string);
      
      if (captureResult.status === 'COMPLETED') {
        // Find and confirm transaction
        const transaction = await prisma.transaction.findFirst({
          where: {
            metadata: {
              path: ['paypalOrderId'],
              equals: token
            },
            status: 'pending'
          }
        });

        if (transaction) {
          await WalletService.confirmTopup(transaction.userId, transaction.id, token as string);
        }

        // Redirect to app with success
        res.redirect(`krieta://topup/success?reference=${transaction?.reference}`);
      } else {
        res.redirect(`krieta://topup/failed`);
      }
    } catch (error: any) {
      console.error('PayPal success handler error:', error);
      res.redirect(`krieta://topup/failed`);
    }
  }

  /**
   * PayPal cancel redirect handler
   */
  static async handlePayPalCancel(req: Request, res: Response): Promise<void> {
    res.redirect(`krieta://topup/cancelled`);
  }

  /**
   * Paystack callback handler
   */
  static async handlePaystackCallback(req: Request, res: Response): Promise<void> {
    try {
      const { reference } = req.query;
      
      if (!reference) {
        res.status(400).send('Missing reference');
        return;
      }

      // Verify the transaction
      const verifyResult = await PaystackService.verifyTransaction(reference as string);
      
      if (verifyResult.success) {
        // Find and confirm transaction
        const transaction = await prisma.transaction.findFirst({
          where: {
            reference: reference as string,
            status: 'pending'
          }
        });

        if (transaction) {
          await WalletService.confirmTopup(transaction.userId, transaction.id, reference as string);
        }

        // Redirect to app with success
        res.redirect(`krieta://topup/success?reference=${reference}`);
      } else {
        res.redirect(`krieta://topup/failed`);
      }
    } catch (error: any) {
      console.error('Paystack callback handler error:', error);
      res.redirect(`krieta://topup/failed`);
    }
  }
}
