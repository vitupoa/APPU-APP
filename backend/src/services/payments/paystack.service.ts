import axios from 'axios';
import { env } from '../../config/env.js';

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

  /**
   * Initiates a Paystack transfer for withdrawal.
   * Supports: Nigeria (NG), Ghana (GH), South Africa (ZA), Kenya (KE)
   */
  static async initiateTransfer(params: {
    accountNumber: string;
    bankCode: string;
    amount: number;
    currency: string;
    reference: string;
    reason: string;
    recipientName: string;
    country?: string; // Country code (NG, GH, ZA, KE)
  }): Promise<{ transferCode: string; reference: string }> {
    const country = params.country || 'NG';
    const accountType = this.getAccountType(country);

    // First, create transfer recipient
    const recipientResponse = await axios.post(
      `${PAYSTACK_BASE}/transferrecipient`,
      {
        type: accountType,
        name: params.recipientName,
        account_number: params.accountNumber,
        bank_code: params.bankCode,
        currency: params.currency.toUpperCase()
      },
      { headers: this.headers() }
    );

    if (!recipientResponse.data.status) {
      throw new Error(`Failed to create recipient: ${recipientResponse.data.message}`);
    }

    const recipientCode = recipientResponse.data.data.recipient_code;

    // Initiate transfer
    const transferResponse = await axios.post(
      `${PAYSTACK_BASE}/transfer`,
      {
        source: 'balance',
        amount: Math.round(params.amount * 100), // Convert to kobo/pesewas/cents
        recipient: recipientCode,
        reason: params.reason,
        reference: params.reference,
        currency: params.currency.toUpperCase()
      },
      { headers: this.headers() }
    );

    if (!transferResponse.data.status) {
      throw new Error(`Transfer failed: ${transferResponse.data.message}`);
    }

    return {
      transferCode: transferResponse.data.data.transfer_code,
      reference: transferResponse.data.data.reference
    };
  }

  /**
   * Gets the account type for a specific country.
   */
  private static getAccountType(country: string): string {
    const accountTypes: Record<string, string> = {
      'NG': 'nuban',        // Nigeria - NUBAN (10 digits)
      'GH': 'ghipss',       // Ghana - GHIPSS
      'ZA': 'bank_account', // South Africa - Standard bank account
      'KE': 'bank_account'  // Kenya - Standard bank account
    };
    return accountTypes[country] || 'nuban';
  }

  /**
   * Verifies bank account name for withdrawal.
   * Supports: Nigeria (NG), Ghana (GH), South Africa (ZA)
   * Note: Kenya (KE) doesn't support account name verification
   */
  static async verifyAccountName(params: {
    accountNumber: string;
    bankCode: string;
    country?: string;
  }): Promise<{
    accountName: string;
    accountNumber: string;
    verified: boolean;
  }> {
    const country = params.country || 'NG';
    
    // Kenya doesn't support account verification
    if (country === 'KE') {
      return {
        accountName: 'Verification not available for Kenya',
        accountNumber: params.accountNumber,
        verified: false
      };
    }

    const response = await axios.get(
      `${PAYSTACK_BASE}/bank/resolve?account_number=${params.accountNumber}&bank_code=${params.bankCode}`,
      { headers: this.headers() }
    );

    if (!response.data.status) {
      throw new Error(`Account verification failed: ${response.data.message}`);
    }

    return {
      accountName: response.data.data.account_name,
      accountNumber: response.data.data.account_number,
      verified: true
    };
  }

  /**
   * Lists supported banks for Paystack transfers.
   * Supports: Nigeria (NG), Ghana (GH), South Africa (ZA), Kenya (KE)
   */
  static async listBanks(country: string = 'NG'): Promise<Array<{
    name: string;
    code: string;
    country: string;
    currency: string;
  }>> {
    const response = await axios.get(
      `${PAYSTACK_BASE}/bank?country=${country}&use_cursor=false&perPage=100`,
      { headers: this.headers() }
    );

    if (!response.data.status) {
      throw new Error('Failed to fetch banks');
    }

    return response.data.data.map((bank: any) => ({
      name: bank.name,
      code: bank.code,
      country: bank.country,
      currency: bank.currency
    }));
  }

  /**
   * Gets supported countries for Paystack transfers.
   */
  static getSupportedCountries(): Array<{
    code: string;
    name: string;
    currency: string;
    accountType: string;
  }> {
    return [
      {
        code: 'NG',
        name: 'Nigeria',
        currency: 'NGN',
        accountType: 'nuban' // 10-digit NUBAN account number
      },
      {
        code: 'GH',
        name: 'Ghana',
        currency: 'GHS',
        accountType: 'ghipss' // Ghana Interbank Payment and Settlement Systems
      },
      {
        code: 'ZA',
        name: 'South Africa',
        currency: 'ZAR',
        accountType: 'bank_account' // Standard bank account
      },
      {
        code: 'KE',
        name: 'Kenya',
        currency: 'KES',
        accountType: 'bank_account' // Standard bank account
      }
    ];
  }
}
