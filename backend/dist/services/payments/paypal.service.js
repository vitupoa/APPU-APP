"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaypalService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
const PAYPAL_BASE = env_1.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
class PaypalService {
    static async getAccessToken() {
        const auth = Buffer.from(`${env_1.env.PAYPAL_CLIENT_ID}:${env_1.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
        const response = await axios_1.default.post(`${PAYPAL_BASE}/v1/oauth2/token`, 'grant_type=client_credentials', {
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data.access_token;
    }
    /**
     * Creates a PayPal order for top-up.
     * Frontend captures with PayPal SDK, then calls our confirm endpoint.
     */
    static async createOrder(params) {
        const token = await this.getAccessToken();
        const response = await axios_1.default.post(`${PAYPAL_BASE}/v2/checkout/orders`, {
            intent: 'CAPTURE',
            purchase_units: [{
                    reference_id: params.referenceId,
                    description: params.description,
                    amount: {
                        currency_code: params.currency.toUpperCase(),
                        value: params.amount.toFixed(2)
                    }
                }],
            application_context: {
                return_url: `${env_1.env.MPESA_CALLBACK_URL}/api/v1/payments/paypal/success`,
                cancel_url: `${env_1.env.MPESA_CALLBACK_URL}/api/v1/payments/paypal/cancel`,
                brand_name: 'Krieta',
                user_action: 'PAY_NOW'
            }
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const approvalLink = response.data.links.find((link) => link.rel === 'approve');
        return {
            orderId: response.data.id,
            approvalUrl: approvalLink?.href || ''
        };
    }
    /**
     * Captures (finalizes) a PayPal order after user approves.
     */
    static async captureOrder(orderId) {
        const token = await this.getAccessToken();
        const response = await axios_1.default.post(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const capture = response.data.purchase_units?.[0]?.payments?.captures?.[0];
        if (!capture || capture.status !== 'COMPLETED') {
            throw new Error('PayPal capture failed');
        }
        return {
            success: true,
            captureId: capture.id,
            amount: parseFloat(capture.amount.value),
            currency: capture.amount.currency_code
        };
    }
}
exports.PaypalService = PaypalService;
//# sourceMappingURL=paypal.service.js.map