import { PayPalClient, OrdersController, PayoutsController } from '@paypal/paypal-server-sdk';
import { Environment } from '@paypal/paypal-server-sdk/dist/models/environment';
import { env } from '../../config/env.js';

export class PaypalService {
  private static client: PayPalClient;
  private static ordersController: OrdersController;
  private static payoutsController: PayoutsController;

  private static initClient() {
    if (!this.client) {
      const environment = env.PAYPAL_MODE === 'live'
        ? Environment.Production
        : Environment.Sandbox;

      this.client = new PayPalClient({
        clientCredentialsAuthCredentials: {
          oAuthClientId: env.PAYPAL_CLIENT_ID,
          oAuthClientSecret: env.PAYPAL_CLIENT_SECRET,
        },
        environment,
      });

      this.ordersController = new OrdersController(this.client);
      this.payoutsController = new PayoutsController(this.client);
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

    const response = await this.ordersController.ordersCreate({
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

    const response = await this.ordersController.ordersCapture({
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
   */
  static async createPayout(params: {
    email: string;
    amount: number;
    currency: string;
    reference: string;
    note: string;
  }): Promise<{ payoutBatchId: string; payoutItemId: string }> {
    this.initClient();

    const response = await this.payoutsController.createPayout({
      body: {
        senderBatchHeader: {
          senderBatchId: params.reference,
          emailSubject: 'Krieta Withdrawal',
          emailMessage: params.note
        },
        items: [{
          recipientType: 'EMAIL',
          amount: {
            value: params.amount.toFixed(2),
            currency: params.currency.toUpperCase()
          },
          receiver: params.email,
          note: params.note,
          senderItemId: params.reference
        }]
      }
    });

    return {
      payoutBatchId: response.result.batchHeader!.payoutBatchId!,
      payoutItemId: response.result.items![0].payoutItemId!
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
