import paypal from '@paypal/checkout-server-sdk';

class PayPalService {
  private client: paypal.core.PayPalHttpClient;

  constructor() {
    const clientId = process.env.PAYPAL_CLIENT_ID || '';
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    const environment = process.env.NODE_ENV === 'production'
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret);
    
    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  /**
   * Create a PayPal order for top-up
   */
  async createOrder(amount: number, currency: string, reference: string, email: string) {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: reference,
          description: `Krieta Wallet Top-up - ${reference}`,
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
        },
      ],
      payer: {
        email_address: email,
      },
      application_context: {
        brand_name: 'Krieta',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.BACKEND_URL}/api/v1/wallet/topup/paypal/success`,
        cancel_url: `${process.env.BACKEND_URL}/api/v1/wallet/topup/paypal/cancel`,
      },
    });

    try {
      const response = await this.client.execute(request);
      const order = response.result;
      
      // Get approval URL
      const approvalUrl = order.links?.find((link: any) => link.rel === 'approve')?.href;
      
      return {
        orderId: order.id,
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
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    try {
      const response = await this.client.execute(request);
      return {
        orderId: response.result.id,
        status: response.result.status,
        payer: response.result.payer,
        amount: response.result.purchase_units[0].amount,
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
      const request = new paypal.notifications.VerifyWebhookSignature();
      request.requestBody({
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: process.env.PAYPAL_WEBHOOK_ID || '',
        webhook_event: body,
      });

      const response = await this.client.execute(request);
      return response.result.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('PayPal webhook verification error:', error);
      return false;
    }
  }
}

export default new PayPalService();
