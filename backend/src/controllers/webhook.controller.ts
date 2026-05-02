import { Request, Response } from 'express';
import { WalletService } from '../modules/wallet/wallet.service.js';
import PayPalService from '../services/payment/paypal.service.js';
import PaystackService from '../services/payment/paystack.service.js';
import { MpesaService } from '../services/payments/mpesa.service.js';
import { prisma } from '../config/database.js';
import { Prisma } from '../generated/prisma/client.js';

export class WebhookController {
  /**
   * PayPal webhook handler with strict security
   */
  static async handlePayPalWebhook(req: Request, res: Response): Promise<void> {
    try {
      // SECURITY: Verify webhook signature
      const isValid = await PayPalService.verifyWebhook(req.headers, req.body);
      
      if (!isValid) {
        console.error('Invalid PayPal webhook signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const event = req.body;
      const eventType = event.event_type;

      console.log(`PayPal webhook received: ${eventType}`);

      // SECURITY: Only process payment capture completed events
      if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
        const resource = event.resource;
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        const captureId = resource.id;
        const amount = parseFloat(resource.amount?.value || '0');
        const currency = resource.amount?.currency_code;

        // SECURITY: Find transaction by PayPal order ID
        const transaction = await prisma.transaction.findFirst({
          where: {
            metadata: {
              path: ['paypalOrderId'],
              equals: orderId
            },
            status: 'pending',
            provider: 'paypal',
            type: 'topup'
          }
        });

        if (!transaction) {
          console.error('Transaction not found for PayPal order:', orderId);
          res.status(200).json({ received: true });
          return;
        }

        // SECURITY: Verify amount matches
        const amountMatch = Math.abs(amount - transaction.amountFiat) < 0.01;
        if (!amountMatch) {
          console.error(`PayPal amount mismatch: Expected ${transaction.amountFiat}, got ${amount}`);
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
              status: 'failed',
              metadata: {
                ...(transaction.metadata as any),
                error: 'Amount mismatch',
                expectedAmount: transaction.amountFiat,
                receivedAmount: amount
              }
            }
          });
          res.status(200).json({ received: true });
          return;
        }

        // SECURITY: Verify currency matches
        if (currency !== transaction.currency) {
          console.error(`PayPal currency mismatch: Expected ${transaction.currency}, got ${currency}`);
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
              status: 'failed',
              metadata: {
                ...(transaction.metadata as any),
                error: 'Currency mismatch'
              }
            }
          });
          res.status(200).json({ received: true });
          return;
        }

        await WalletService.confirmTopup(
          transaction.userId, 
          transaction.id, 
          captureId,
          amount,
          currency
        );
        console.log(`✅ PayPal payment confirmed for transaction ${transaction.id}`);
      }

      // SECURITY: Handle payment capture denied/failed
      if (eventType === 'PAYMENT.CAPTURE.DENIED' || eventType === 'PAYMENT.CAPTURE.DECLINED') {
        const resource = event.resource;
        const orderId = resource.supplementary_data?.related_ids?.order_id;

        const transaction = await prisma.transaction.findFirst({
          where: {
            metadata: {
              path: ['paypalOrderId'],
              equals: orderId
            },
            status: 'pending',
            provider: 'paypal'
          }
        });

        if (transaction) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
              status: 'cancelled',
              metadata: {
                ...(transaction.metadata as any),
                failureReason: eventType
              }
            }
          });
          console.log(`❌ PayPal payment cancelled for transaction ${transaction.id}`);
        }
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('PayPal webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Paystack webhook handler with strict security
   */
  static async handlePaystackWebhook(req: Request, res: Response): Promise<void> {
    try {
      // SECURITY: Verify webhook signature
      const signature = req.headers['x-paystack-signature'] as string;
      const payload = JSON.stringify(req.body);
      
      if (!signature) {
        console.error('Missing Paystack webhook signature');
        res.status(401).json({ error: 'Missing signature' });
        return;
      }

      const isValid = PaystackService.verifyWebhookSignature(payload, signature);
      
      if (!isValid) {
        console.error('Invalid Paystack webhook signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const event = req.body;
      const eventType = event.event;

      console.log(`Paystack webhook received: ${eventType}`);

      // SECURITY: Handle charge success
      if (eventType === 'charge.success') {
        const data = event.data;
        const reference = data.reference;
        const channel = data.channel;
        const amount = data.amount / 100; // Convert from kobo to main currency
        const currency = data.currency;
        const paystackTxId = data.id;

        // SECURITY: Find transaction by reference
        const transaction = await prisma.transaction.findFirst({
          where: {
            reference,
            status: 'pending',
            provider: 'paystack',
            type: 'topup'
          }
        });

        if (!transaction) {
          console.error('Transaction not found for Paystack reference:', reference);
          res.status(200).json({ received: true });
          return;
        }

        // SECURITY: Verify amount matches
        const amountMatch = Math.abs(amount - transaction.amountFiat) < 0.01;
        if (!amountMatch) {
          console.error(`Paystack amount mismatch: Expected ${transaction.amountFiat}, got ${amount}`);
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
              status: 'failed',
              metadata: {
                ...(transaction.metadata as any),
                error: 'Amount mismatch',
                expectedAmount: transaction.amountFiat,
                receivedAmount: amount
              }
            }
          });
          res.status(200).json({ received: true });
          return;
        }

        // SECURITY: Verify currency matches
        if (currency !== transaction.currency) {
          console.error(`Paystack currency mismatch: Expected ${transaction.currency}, got ${currency}`);
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
              status: 'failed',
              metadata: {
                ...(transaction.metadata as any),
                error: 'Currency mismatch'
              }
            }
          });
          res.status(200).json({ received: true });
          return;
        }

        // Update metadata with payment channel
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            metadata: {
              ...(transaction.metadata as any),
              paymentChannel: channel,
              paystackTransactionId: paystackTxId,
              verifiedAmount: amount
            }
          }
        });

        await WalletService.confirmTopup(
          transaction.userId, 
          transaction.id, 
          reference,
          amount,
          currency
        );
        console.log(`✅ Paystack payment confirmed for transaction ${transaction.id} via ${channel}`);
      }

      // SECURITY: Handle charge failure
      if (eventType === 'charge.failed') {
        const data = event.data;
        const reference = data.reference;

        const transaction = await prisma.transaction.findFirst({
          where: {
            reference,
            status: 'pending',
            provider: 'paystack'
          }
        });

        if (transaction) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
              status: 'cancelled',
              metadata: {
                ...(transaction.metadata as any),
                failureReason: data.gateway_response || 'Payment failed'
              }
            }
          });
          console.log(`❌ Paystack payment cancelled for transaction ${transaction.id}`);
        }
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Paystack webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PayPal success redirect handler with verification
   */
  static async handlePayPalSuccess(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query; // PayPal order ID
      
      if (!token) {
        res.status(400).send('Missing order ID');
        return;
      }

      // SECURITY: Capture and verify the payment with PayPal
      const captureResult = await PayPalService.captureOrder(token as string);
      
      if (captureResult.status === 'COMPLETED') {
        // SECURITY: Find transaction by PayPal order ID
        const transaction = await prisma.transaction.findFirst({
          where: {
            metadata: {
              path: ['paypalOrderId'],
              equals: token
            },
            status: 'pending',
            provider: 'paypal',
            type: 'topup'
          }
        });

        if (transaction) {
          // SECURITY: Verify amount from PayPal response
          const paidAmount = parseFloat(captureResult.amount.value);
          const paidCurrency = captureResult.amount.currencyCode;

          await WalletService.confirmTopup(
            transaction.userId, 
            transaction.id, 
            token as string,
            paidAmount,
            paidCurrency
          );
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
   * Paystack callback handler with verification
   */
  static async handlePaystackCallback(req: Request, res: Response): Promise<void> {
    try {
      const { reference } = req.query;
      
      if (!reference) {
        res.status(400).send('Missing reference');
        return;
      }

      // SECURITY: Verify the transaction with Paystack API
      const verifyResult = await PaystackService.verifyTransaction(reference as string);
      
      if (verifyResult.success) {
        // SECURITY: Find transaction by reference
        const transaction = await prisma.transaction.findFirst({
          where: {
            reference: reference as string,
            status: 'pending',
            provider: 'paystack',
            type: 'topup'
          }
        });

        if (transaction) {
          // SECURITY: Verify amount and currency from Paystack response
          await WalletService.confirmTopup(
            transaction.userId, 
            transaction.id, 
            reference as string,
            verifyResult.amount,
            verifyResult.currency
          );
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

  /**
   * M-Pesa STK Push callback handler with strict security
   */
  static async handleMpesaCallback(req: Request, res: Response): Promise<void> {
    try {
      console.log('M-Pesa callback received:', JSON.stringify(req.body));
      
      // SECURITY: Validate callback structure
      if (!req.body?.Body?.stkCallback) {
        console.error('Invalid M-Pesa callback structure');
        res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid callback structure' });
        return;
      }

      const callbackData = MpesaService.parseCallback(req.body);
      
      // SECURITY: Find transaction by checkout request ID with strict matching
      const transaction = await prisma.transaction.findFirst({
        where: {
          metadata: {
            path: ['checkoutRequestId'],
            equals: callbackData.checkoutRequestId
          },
          status: 'pending',
          provider: 'mpesa',
          type: 'topup'
        }
      });

      if (!transaction) {
        console.error('Transaction not found for checkout request:', callbackData.checkoutRequestId);
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
        return;
      }

      if (callbackData.success) {
        // SECURITY: Verify amount matches (M-Pesa returns amount in callback)
        if (callbackData.amount) {
          const amountMatch = Math.abs(callbackData.amount - transaction.amountFiat) < 0.01;
          if (!amountMatch) {
            console.error(`M-Pesa amount mismatch: Expected ${transaction.amountFiat}, got ${callbackData.amount}`);
            await prisma.transaction.update({
              where: { id: transaction.id },
              data: { 
                status: 'failed',
                metadata: {
                  ...(transaction.metadata as any),
                  error: 'Amount mismatch',
                  expectedAmount: transaction.amountFiat,
                  receivedAmount: callbackData.amount
                }
              }
            });
            res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
            return;
          }
        }

        // Update metadata with M-Pesa receipt
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            metadata: {
              ...(transaction.metadata as any),
              mpesaReceiptNumber: callbackData.mpesaReceiptNumber,
              phoneNumber: callbackData.phoneNumber,
              verifiedAmount: callbackData.amount
            }
          }
        });

        // SECURITY: Confirm with verified amount
        await WalletService.confirmTopup(
          transaction.userId,
          transaction.id,
          callbackData.mpesaReceiptNumber,
          callbackData.amount,
          transaction.currency
        );
        console.log(`✅ M-Pesa payment confirmed for transaction ${transaction.id}`);
      } else {
        // SECURITY: Mark transaction as cancelled, never credit wallet
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { 
            status: 'cancelled',
            metadata: {
              ...(transaction.metadata as any),
              failureReason: 'User cancelled or payment failed'
            }
          }
        });
        console.log(`❌ M-Pesa payment cancelled for transaction ${transaction.id}`);
      }

      // Acknowledge M-Pesa callback
      res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (error: any) {
      console.error('M-Pesa callback error:', error);
      // Always acknowledge to M-Pesa to prevent retries
      res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
  }
}
