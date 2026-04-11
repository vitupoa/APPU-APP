"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('3000').transform(Number),
    CORS_ORIGIN: zod_1.z.string().default('*'),
    // Rate Limiting
    RATE_LIMIT_MAX: zod_1.z.string().default('100').transform(Number),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().default('900000').transform(Number),
    // Security
    REQUEST_SIGNING_KEY: zod_1.z.string().min(16, 'REQUEST_SIGNING_KEY must be at least 16 characters'),
    // Database
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    // Redis
    REDIS_URL: zod_1.z.string().min(1, 'REDIS_URL is required'),
    // JWT
    JWT_ACCESS_SECRET: zod_1.z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRY: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRY: zod_1.z.string().default('7d'),
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().min(1),
    CLOUDINARY_API_KEY: zod_1.z.string().min(1),
    CLOUDINARY_API_SECRET: zod_1.z.string().min(1),
    // PayPal
    PAYPAL_CLIENT_ID: zod_1.z.string().optional(),
    PAYPAL_CLIENT_SECRET: zod_1.z.string().optional(),
    PAYPAL_MODE: zod_1.z.enum(['sandbox', 'live']).default('sandbox'),
    // Paystack
    PAYSTACK_SECRET_KEY: zod_1.z.string().optional(),
    PAYSTACK_PUBLIC_KEY: zod_1.z.string().optional(),
    // M-Pesa (Daraja)
    MPESA_CONSUMER_KEY: zod_1.z.string().optional(),
    MPESA_CONSUMER_SECRET: zod_1.z.string().optional(),
    MPESA_SHORTCODE: zod_1.z.string().optional(),
    MPESA_PASSKEY: zod_1.z.string().optional(),
    MPESA_ENV: zod_1.z.enum(['sandbox', 'production']).default('sandbox'),
    MPESA_CALLBACK_URL: zod_1.z.string().optional(),
    // Payoneer
    PAYONEER_PARTNER_ID: zod_1.z.string().optional(),
    PAYONEER_API_TOKEN: zod_1.z.string().optional(),
    // Exchange Rate API
    EXCHANGE_RATE_BASE_URL: zod_1.z.string().default('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies'),
});
function validateEnv() {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const missing = error.issues.map((i) => i.path.join('.')).join(', ');
            console.error(`❌ Environment validation failed: ${missing}`);
            throw new Error(`Invalid environment variables: ${missing}`);
        }
        throw error;
    }
}
exports.env = validateEnv();
//# sourceMappingURL=env.js.map