import axios from 'axios';
import { env } from '../../config/env';

const PAYSTACK_BASE = 'https://api.paystack.co';

export class PaystackService {
  private static headers() {
    return {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Initializes a Paystack transaction for top-up.
   * Returns an authorization_url for the user to complete payment.
   */
  static async initializeTransaction(params: {
    email: string;
    amount: number; // in kobo/cents (multiply by 100)
    currency: string;
    reference: string;
    callbackUrl?: string;
  }): Promise<{ authorizationUrl: string; reference: string; accessCode: string }> {
    const response = await axios.post(`${PAYSTACK_BASE}/transaction/initialize`, {
      email: params.email,
      amount: Math.round(params.amount * 100), // Paystack expects kobo/cents
      currency: params.currency.toUpperCase(),
      reference: params.reference,
      callback_url: params.callbackUrl || `${env.MPESA_CALLBACK_URL}/api/v1/payments/paystack/callback`
    }, {
      headers: this.headers()
    });

    if (!response.data.status) {
      throw new Error(`Paystack init failed: ${response.data.message}`);
    }

    return {
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
      accessCode: response.data.data.access_code
    };
  }

  /**
   * Verifies a Paystack transaction by reference.
   */
  static async verifyTransaction(reference: string): Promise<{
    success: boolean;
    amount: number;
    currency: string;
    channel: string;
    paidAt: string;
  }> {
    const response = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${reference}`,
      { headers: this.headers() }
    );

    const data = response.data.data;
    if (data.status !== 'success') {
      throw new Error(`Transaction not successful: ${data.status}`);
    }

    return {
      success: true,
      amount: data.amount / 100, // Convert back from kobo
      currency: data.currency,
      channel: data.channel,
      paidAt: data.paid_at
    };
  }

  /**
   * Processes Paystack webhook events.
   */
  static parseWebhook(body: any): {
    event: string;
    reference: string;
    amount: number;
    currency: string;
    status: string;
  } {
    return {
      event: body.event,
      reference: body.data.reference,
      amount: body.data.amount / 100,
      currency: body.data.currency,
      status: body.data.status
    };
  }

  /**
   * Verifies Paystack webhook signature.
   */
  static verifyWebhookSignature(body: string, signature: string): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex');
    return hash === signature;
  }
}
