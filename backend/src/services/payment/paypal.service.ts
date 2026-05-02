import { Client, OrdersController, PaymentsController, Environment } from '@paypal/paypal-server-sdk';

class PayPalService {
  private client: Client;
  private ordersController: OrdersController;
  private paymentsController: PaymentsController;

  constructor() {
    const clientId = process.env.PAYPAL_CLIENT_ID || '';
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    const environment = process.env.NODE_ENV === 'production'
      ? Environment.Production
      : Environment.Sandbox;
    
    this.client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: clientId,
        oAuthClientSecret: clientSecret,
      },
      environment,
    });
    
    this.ordersController = new OrdersController(this.client);
    this.paymentsController = new PaymentsController(this.client);
  }

  /**
   * Create a PayPal order for top-up
   */
  async createOrder(amount: number, currency: string, reference: string, email: string) {
    try {
      const response = await this.ordersController.createOrder({
        body: {
          intent: 'CAPTURE' as any,
          purchaseUnits: [
            {
              referenceId: reference,
              description: `Krieta Wallet Top-up - ${reference}`,
              amount: {
                currencyCode: currency,
                value: amount.toFixed(2),
              },
            },
          ],
          payer: {
            emailAddress: email,
          },
          applicationContext: {
            brandName: 'Krieta',
            landingPage: 'BILLING' as any,
            userAction: 'PAY_NOW' as any,
            returnUrl: `${process.env.BACKEND_URL}/api/v1/wallet/topup/paypal/success`,
            cancelUrl: `${process.env.BACKEND_URL}/api/v1/wallet/topup/paypal/cancel`,
          },
        },
        prefer: 'return=representation',
      });
      
      const order = response.result;
      const approvalUrl = order.links?.find((link) => link.rel === 'approve')?.href;
      
      return {
        orderId: order.id!,
        approvalUrl,
        status: order.status,
      };
    } catch (error: any) {
      console.error('PayPal order creation error:', error);
      throw new Error(`PayPal order creation failed: ${error.message}`);
    }
  }

  /**
   * Capture payment after user approves
   */
  async captureOrder(orderId: string) {
    try {
      const response = await this.ordersController.captureOrder({
        id: orderId,
        prefer: 'return=representation',
      });
      
      return {
        orderId: response.result.id!,
        status: response.result.status,
        payer: response.result.payer,
        amount: response.result.purchaseUnits![0].amount,
      };
    } catch (error: any) {
      console.error('PayPal capture error:', error);
      throw new Error(`PayPal capture failed: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhook(headers: any, body: any): Promise<boolean> {
    try {
      const response = await (this.paymentsController as any).verifyWebhookSignature({
        body: {
          authAlgo: headers['paypal-auth-algo'],
          certUrl: headers['paypal-cert-url'],
          transmissionId: headers['paypal-transmission-id'],
          transmissionSig: headers['paypal-transmission-sig'],
          transmissionTime: headers['paypal-transmission-time'],
          webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
          webhookEvent: body,
        },
      });

      return response.result.verificationStatus === 'SUCCESS';
    } catch (error) {
      console.error('PayPal webhook verification error:', error);
      return false;
    }
  }
}

export default new PayPalService();
