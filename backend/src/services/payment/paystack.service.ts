import axios from 'axios';
import crypto from 'crypto';

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    channel: string;
    customer: {
      email: string;
    };
  };
}

class PaystackService {
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    this.baseUrl = 'https://api.paystack.co';
  }

  /**
   * Initialize a Paystack transaction
   * Supports: Cards, Bank Transfer, USSD, Mobile Money (Ghana, Kenya, Rwanda, Tanzania, Uganda, Zambia)
   */
  async initializeTransaction(
    amount: number,
    currency: string,
    email: string,
    reference: string,
    channels?: string[]
  ) {
    try {
      // Convert amount to kobo/pesewas/cents (Paystack uses smallest currency unit)
      const amountInMinorUnit = Math.round(amount * 100);

      // Default channels: card, bank, ussd, mobile_money, bank_transfer
      const paymentChannels = channels || ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer'];

      const response = await axios.post<PaystackInitializeResponse>(
        `${this.baseUrl}/transaction/initialize`,
        {
          email,
          amount: amountInMinorUnit,
          currency,
          reference,
          channels: paymentChannels,
          callback_url: `${process.env.BACKEND_URL}/api/v1/wallet/topup/paystack/callback`,
          metadata: {
            custom_fields: [
              {
                display_name: 'Purpose',
                variable_name: 'purpose',
                value: 'Wallet Top-up',
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status) {
        return {
          authorizationUrl: response.data.data.authorization_url,
          accessCode: response.data.data.access_code,
          reference: response.data.data.reference,
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Paystack initialization error:', error.response?.data || error.message);
      throw new Error(`Paystack initialization failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify a transaction
   */
  async verifyTransaction(reference: string) {
    try {
      const response = await axios.get<PaystackVerifyResponse>(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      if (response.data.status && response.data.data.status === 'success') {
        return {
          success: true,
          reference: response.data.data.reference,
          amount: response.data.data.amount / 100, // Convert back from kobo
          currency: response.data.data.currency,
          channel: response.data.data.channel,
          email: response.data.data.customer.email,
        };
      } else {
        return {
          success: false,
          message: response.data.message,
        };
      }
    } catch (error: any) {
      console.error('Paystack verification error:', error.response?.data || error.message);
      throw new Error(`Paystack verification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex');
    
    return hash === signature;
  }

  /**
   * Get supported payment channels for a country
   */
  getSupportedChannels(countryCode: string): string[] {
    const channelsByCountry: Record<string, string[]> = {
      NG: ['card', 'bank', 'ussd', 'bank_transfer', 'qr'], // Nigeria
      GH: ['card', 'mobile_money', 'bank'], // Ghana - MTN, Vodafone, AirtelTigo
      KE: ['card', 'mobile_money', 'bank'], // Kenya - M-Pesa, Airtel Money
      ZA: ['card', 'bank', 'eft'], // South Africa
      RW: ['card', 'mobile_money'], // Rwanda - MTN, Airtel
      TZ: ['card', 'mobile_money'], // Tanzania - M-Pesa, Airtel, Tigo
      UG: ['card', 'mobile_money'], // Uganda - MTN, Airtel
      ZM: ['card', 'mobile_money'], // Zambia - MTN, Airtel
    };

    return channelsByCountry[countryCode] || ['card', 'bank'];
  }

  /**
   * Get mobile money providers for a country
   */
  getMobileMoneyProviders(countryCode: string): string[] {
    const providers: Record<string, string[]> = {
      GH: ['MTN', 'Vodafone', 'AirtelTigo'],
      KE: ['M-Pesa', 'Airtel Money'],
      RW: ['MTN Mobile Money', 'Airtel Money'],
      TZ: ['M-Pesa', 'Airtel Money', 'Tigo Pesa'],
      UG: ['MTN Mobile Money', 'Airtel Money'],
      ZM: ['MTN Mobile Money', 'Airtel Money'],
    };

    return providers[countryCode] || [];
  }
}

export default new PaystackService();
