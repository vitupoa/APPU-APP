"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUsernameSchema = exports.logoutSchema = exports.refreshTokenSchema = exports.oauthSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters').regex(/^[A-Za-z\-']+$/, 'First name can only contain letters, hyphens, and apostrophes'),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters').regex(/^[A-Za-z\-']+$/, 'Last name can only contain letters, hyphens, and apostrophes'),
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
    phone: zod_1.z.string().optional(),
    accountType: zod_1.z.enum(['CREATOR', 'BUSINESS']).default('CREATOR'),
    country: zod_1.z.string().length(2, 'Country must be a 2-letter ISO code'),
    currency: zod_1.z.string().length(3, 'Currency must be a 3-letter ISO code'),
    deviceId: zod_1.z.string().min(1, 'Device ID is required'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address').optional(),
    phone: zod_1.z.string().optional(),
    username: zod_1.z.string().optional(),
    password: zod_1.z.string().min(1, 'Password is required'),
    deviceId: zod_1.z.string().min(1, 'Device ID is required'),
}).refine(data => data.email || data.phone || data.username, {
    message: "Either email, phone, or username must be provided",
});
// For OAuth signup/login (Google/Apple)
exports.oauthSchema = zod_1.z.object({
    provider: zod_1.z.enum(['google', 'apple']),
    token: zod_1.z.string().min(1, 'OAuth token is required'),
    deviceId: zod_1.z.string().min(1, 'Device ID is required'),
    // If it's a first time OAuth signup, these are required:
    country: zod_1.z.string().length(2).optional(),
    currency: zod_1.z.string().length(3).optional(),
    accountType: zod_1.z.enum(['CREATOR', 'BUSINESS']).optional(),
    // For OAuth, we'll suggest usernames if missing, but they can provide one
    username: zod_1.z.string().min(3).regex(/^[a-z0-9_]+$/).optional(),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    deviceId: zod_1.z.string().min(1, 'Device ID is required'),
});
exports.logoutSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    deviceId: zod_1.z.string().min(1, 'Device ID is required'),
});
exports.checkUsernameSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).regex(/^[a-z0-9_]+$/),
});
//# sourceMappingURL=auth.validation.js.map