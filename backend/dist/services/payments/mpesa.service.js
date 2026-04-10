"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MpesaService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
const MPESA_AUTH_URL = env_1.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const MPESA_STK_URL = env_1.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
const MPESA_QUERY_URL = env_1.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
    : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';
class MpesaService {
    static async getAccessToken() {
        const auth = Buffer.from(`${env_1.env.MPESA_CONSUMER_KEY}:${env_1.env.MPESA_CONSUMER_SECRET}`).toString('base64');
        const response = await axios_1.default.get(MPESA_AUTH_URL, {
            headers: { Authorization: `Basic ${auth}` }
        });
        return response.data.access_token;
    }
    static generatePassword() {
        const timestamp = new Date().toISOString()
            .replace(/[-T:.Z]/g, '')
            .substring(0, 14);
        const password = Buffer.from(`${env_1.env.MPESA_SHORTCODE}${env_1.env.MPESA_PASSKEY}${timestamp}`).toString('base64');
        return { password, timestamp };
    }
    /**
     * Initiates an STK Push (Lipa Na M-Pesa Online).
     * User gets a prompt on their phone to enter PIN.
     */
    static async initiateStk(params) {
        const token = await this.getAccessToken();
        const { password, timestamp } = this.generatePassword();
        // M-Pesa requires whole numbers in KES
        const roundedAmount = Math.ceil(params.amount);
        const response = await axios_1.default.post(MPESA_STK_URL, {
            BusinessShortCode: env_1.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: roundedAmount,
            PartyA: params.phoneNumber,
            PartyB: env_1.env.MPESA_SHORTCODE,
            PhoneNumber: params.phoneNumber,
            CallBackURL: `${env_1.env.MPESA_CALLBACK_URL}/api/v1/payments/mpesa/callback`,
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
    static async queryStatus(checkoutRequestId) {
        const token = await this.getAccessToken();
        const { password, timestamp } = this.generatePassword();
        const response = await axios_1.default.post(MPESA_QUERY_URL, {
            BusinessShortCode: env_1.env.MPESA_SHORTCODE,
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
    static parseCallback(body) {
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
        const getValue = (name) => items.find((i) => i.Name === name)?.Value;
        return {
            success: true,
            checkoutRequestId,
            amount: getValue('Amount'),
            mpesaReceiptNumber: getValue('MpesaReceiptNumber'),
            phoneNumber: getValue('PhoneNumber')?.toString()
        };
    }
}
exports.MpesaService = MpesaService;
//# sourceMappingURL=mpesa.service.js.map