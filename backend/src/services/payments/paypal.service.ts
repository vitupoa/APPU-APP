import { Client, OrdersController, Environment } from '@paypal/paypal-server-sdk';
import { env } from '../../config/env.js';

export class PaypalService {
  private static client: Client;
  private static ordersController: OrdersController;

  private static initClient() {
    if (!this.client) {
      const environment = env.PAYPAL_MODE === 'live'
        ? Environment.Production
        : Environment.Sandbox;

      this.client = new Client({
        clientCredentialsAuthCredentials: {
          oAuthClientId: env.PAYPAL_CLIENT_ID,
          oAuthClientSecret: env.PAYPAL_CLIENT_SECRET,
        },
        environment,
      });

      this.ordersController = new OrdersController(this.client);
    }
  }

  /**
   * Creates a PayPal order for top-up. 
   * Frontend captures with PayPal SDK, then calls our confirm endpoint.
   */
  static async createOrder(params: {
    amount: number;
    currency: string;
    description: string;
    referenceId: string;
  }): Promise<{ orderId: string; approvalUrl: string }> {
    this.initClient();

    const response = await this.ordersController.createOrder({
      body: {
        intent: 'CAPTURE',
        purchaseUnits: [{
          referenceId: params.referenceId,
          description: params.description,
          amount: {
            currencyCode: params.currency.toUpperCase(),
            value: params.amount.toFixed(2)
          }
        }],
        applicationContext: {
          returnUrl: `${env.MPESA_CALLBACK_URL}/api/v1/payments/paypal/success`,
          cancelUrl: `${env.MPESA_CALLBACK_URL}/api/v1/payments/paypal/cancel`,
          brandName: 'Krieta',
          userAction: 'PAY_NOW'
        }
      },
      prefer: 'return=representation'
    });

    const approvalLink = response.result.links?.find(
      (link) => link.rel === 'approve'
    );

    return {
      orderId: response.result.id!,
      approvalUrl: approvalLink?.href || ''
    };
  }

  /**
   * Captures (finalizes) a PayPal order after user approves.
   */
  static async captureOrder(orderId: string): Promise<{
    success: boolean;
    captureId: string;
    amount: number;
    currency: string;
  }> {
    this.initClient();

    const response = await this.ordersController.captureOrder({
      id: orderId,
      prefer: 'return=representation'
    });

    const capture = response.result.purchaseUnits?.[0]?.payments?.captures?.[0];
    if (!capture || capture.status !== 'COMPLETED') {
      throw new Error('PayPal capture failed');
    }

    return {
      success: true,
      captureId: capture.id!,
      amount: parseFloat(capture.amount!.value!),
      currency: capture.amount!.currencyCode!
    };
  }

  /**
   * Creates a PayPal payout for withdrawal.
   * Note: PayPal Payouts API requires separate approval and is not in the standard SDK.
   * Using direct REST API for payouts.
   */
  static async createPayout(params: {
    email: string;
    amount: number;
    currency: string;
    reference: string;
    note: string;
  }): Promise<{ payoutBatchId: string; payoutItemId: string }> {
    // Payouts require direct REST API call as SDK doesn't include Payouts controller
    const axios = (await import('axios')).default;
    const baseUrl = env.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    // Get access token
    const auth = Buffer.from(
      `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const tokenResponse = await axios.post(
      `${baseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const response = await axios.post(
      `${baseUrl}/v1/payments/payouts`,
      {
        sender_batch_header: {
          sender_batch_id: params.reference,
          email_subject: 'Krieta Withdrawal',
          email_message: params.note
        },
        items: [{
          recipient_type: 'EMAIL',
          amount: {
            value: params.amount.toFixed(2),
            currency: params.currency.toUpperCase()
          },
          receiver: params.email,
          note: params.note,
          sender_item_id: params.reference
        }]
      },
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      payoutBatchId: response.data.batch_header.payout_batch_id,
      payoutItemId: response.data.items[0].payout_item_id
    };
  }

  /**
   * Verifies PayPal account email.
   */
  static async verifyEmail(email: string): Promise<{
    accountName: string;
    verified: boolean;
  }> {
    // PayPal doesn't provide direct email verification API
    // This would require user to link their PayPal account
    return {
      accountName: email,
      verified: false
    };
  }
}
