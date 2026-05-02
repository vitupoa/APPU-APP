import axios from 'axios';
import { env } from '../../config/env.js';

const MPESA_AUTH_URL = env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
  : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

const MPESA_STK_URL = env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
  : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

const MPESA_QUERY_URL = env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
  : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';

export class MpesaService {
  private static async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await axios.get(MPESA_AUTH_URL, {
      headers: { Authorization: `Basic ${auth}` }
    });

    return response.data.access_token;
  }

  private static generatePassword(): { password: string; timestamp: string } {
    const timestamp = new Date().toISOString()
      .replace(/[-T:.Z]/g, '')
      .substring(0, 14);
    const password = Buffer.from(
      `${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');
    return { password, timestamp };
  }

  /**
   * Initiates an STK Push (Lipa Na M-Pesa Online).
   * User gets a prompt on their phone to enter PIN.
   */
  static async initiateStk(params: {
    phoneNumber: string;
    amount: number;
    accountReference: string;
    transactionDesc: string;
  }): Promise<{ checkoutRequestId: string; merchantRequestId: string }> {
    const token = await this.getAccessToken();
    const { password, timestamp } = this.generatePassword();

    // M-Pesa requires whole numbers in KES
    const roundedAmount = Math.ceil(params.amount);

    const response = await axios.post(MPESA_STK_URL, {
      BusinessShortCode: env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: roundedAmount,
      PartyA: params.phoneNumber,
      PartyB: env.MPESA_SHORTCODE,
      PhoneNumber: params.phoneNumber,
      CallBackURL: `${env.MPESA_CALLBACK_URL}/api/v1/payments/mpesa/callback`,
      AccountReference: params.accountReference,
      TransactionDesc: params.transactionDesc
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.ResponseCode !== '0') {
      throw new Error(`M-Pesa STK Push failed: ${response.data.ResponseDescription}`);
    }

    return {
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID
    };
  }

  /**
   * Queries the status of an STK Push transaction.
   */
  static async queryStatus(checkoutRequestId: string): Promise<{
    resultCode: string;
    resultDesc: string;
  }> {
    const token = await this.getAccessToken();
    const { password, timestamp } = this.generatePassword();

    const response = await axios.post(MPESA_QUERY_URL, {
      BusinessShortCode: env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      resultCode: response.data.ResultCode,
      resultDesc: response.data.ResultDesc
    };
  }

  /**
   * Processes the M-Pesa callback from Safaricom.
   * Called when user completes or cancels the STK Push.
   */
  static parseCallback(body: any): {
    success: boolean;
    checkoutRequestId: string;
    amount?: number;
    mpesaReceiptNumber?: string | null;
    phoneNumber?: string | null;
  } {
    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      throw new Error('Invalid M-Pesa callback payload');
    }

    const resultCode = stkCallback.ResultCode;
    const checkoutRequestId = stkCallback.CheckoutRequestID;

    if (resultCode !== 0) {
      return {
        success: false,
        checkoutRequestId,
      };
    }

    // Extract metadata items
    const items = stkCallback.CallbackMetadata?.Item || [];
    const getValue = (name: string) => items.find((i: any) => i.Name === name)?.Value;

    return {
      success: true,
      checkoutRequestId,
      amount: getValue('Amount'),
      mpesaReceiptNumber: getValue('MpesaReceiptNumber'),
      phoneNumber: getValue('PhoneNumber')?.toString()
    };
  }

  /**
   * Initiates B2C (Business to Customer) withdrawal to M-Pesa.
   */
  static async initiateWithdrawal(params: {
    phoneNumber: string;
    amount: number;
    reference: string;
    remarks: string;
  }): Promise<{ conversationId: string; originatorConversationId: string }> {
    const token = await this.getAccessToken();
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);
    const securityCredential = Buffer.from(
      `${env.MPESA_INITIATOR_PASSWORD}`
    ).toString('base64');

    const response = await axios.post(
      env.MPESA_ENV === 'production'
        ? 'https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest'
        : 'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest',
      {
        InitiatorName: env.MPESA_INITIATOR_NAME,
        SecurityCredential: securityCredential,
        CommandID: 'BusinessPayment',
        Amount: Math.ceil(params.amount),
        PartyA: env.MPESA_SHORTCODE,
        PartyB: params.phoneNumber,
        Remarks: params.remarks,
        QueueTimeOutURL: `${env.MPESA_CALLBACK_URL}/api/v1/payments/mpesa/b2c/timeout`,
        ResultURL: `${env.MPESA_CALLBACK_URL}/api/v1/payments/mpesa/b2c/result`,
        Occasion: params.reference
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.ResponseCode !== '0') {
      throw new Error(`M-Pesa B2C failed: ${response.data.ResponseDescription}`);
    }

    return {
      conversationId: response.data.ConversationID,
      originatorConversationId: response.data.OriginatorConversationID
    };
  }

  /**
   * Verifies M-Pesa account name for withdrawal.
   */
  static async verifyAccountName(phoneNumber: string): Promise<{
    accountName: string;
    verified: boolean;
  }> {
    // M-Pesa doesn't provide direct name verification API
    // This would require integration with third-party KYC services
    // For now, return a placeholder
    return {
      accountName: 'M-Pesa User',
      verified: false
    };
  }
}
