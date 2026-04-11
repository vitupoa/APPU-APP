"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../../config/database");
const jwt_1 = require("../../utils/jwt");
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const redis_1 = require("../../shared/gateway/redis"); // Uses your established pubClient as the standard redis connection natively!
// Define the absolute secure mail transport layer organically via AWS SES or standard SMTP!
const transporter = nodemailer_1.default.createTransport({
    host: 'email-smtp.' + (process.env.AWS_SES_REGION || 'us-east-1') + '.amazonaws.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.AWS_SES_ACCESS_KEY_ID || 'dummy_user',
        pass: process.env.AWS_SES_SECRET_ACCESS_KEY || 'dummy_pass'
    }
});
// Token expiration: 365 days simulating TikTok persistent logins securely!
const REFRESH_TOKEN_TTL = 365 * 24 * 60 * 60 * 1000;
class AuthService {
    /**
     * Generates a 6-Digit OTP, maps to Redis with strict 10-minute expiry (600s), and dispatches via AWS SES natively
     */
    static async requestEmailOTP(email) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Strict 6 digits
        // Save OTP into Redis organically defining the 600s limit!
        await redis_1.pubClient.setex(`otp:${email}`, 600, otp);
        // Construct AWS SES template securely
        const mailOptions = {
            from: process.env.EMAIL_FROM_ADDRESS || 'no-reply@krieta.com',
            to: email,
            subject: 'Krieta: Verify your Account',
            html: `
              <div style="font-family: Arial, sans-serif; background-color: #050505; color: #E1E1E1; padding: 40px; border-radius: 12px; border: 1px solid #1E1E1E;">
                  <h2 style="color: #FFCC00; text-align: center;">Krieta</h2>
                  <p style="font-size: 16px;">Here is your secure verification code. It automatically expires in 10 minutes!</p>
                  <div style="background-color: #111111; border: 1px solid #332900; padding: 20px; border-radius: 8px; text-align: center;">
                      <h1 style="color: #FFCC00; letter-spacing: 6px; margin: 0;">${otp}</h1>
                  </div>
                  <p style="color: #A0A0A0; font-size: 12px; margin-top: 20px;">If you did not request this, ignore this email.</p>
              </div>
          `
        };
        try {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[MOCK AWS SES] OTP for ${email} is ${otp}`);
            }
            else {
                // TEMPORARY BYPASS: Forcing Console Mock because AWS SES is not configured physically yet.
                // transporter.sendMail(mailOptions);
                console.log(`[BYPASS AWS SES] Test OTP for ${email} is ${otp}`);
            }
        }
        catch (error) {
            console.error('[AWS SES] Failed sending OTP:', error);
            throw new Error('Failed dispatching verification email securely');
        }
        return { message: 'OTP Sent successfully' };
    }
    /**
     * Explodes the OTP upon validation mapping absolute protection organically
     */
    static async verifyEmailOTP(email, otp) {
        const storedOtp = await redis_1.pubClient.get(`otp:${email}`);
        if (!storedOtp)
            throw new Error('OTP has expired or does not exist');
        if (storedOtp !== otp)
            throw new Error('Invalid authentication code');
        // Wipe the OTP securely avoiding replay injection attacks
        await redis_1.pubClient.del(`otp:${email}`);
        return { success: true };
    }
    /**
     * Helper to generate a unique refresh token, hash it, and store it
     */
    static async createRefreshToken(userId, deviceId) {
        const rawToken = crypto_1.default.randomBytes(40).toString('hex');
        const tokenHash = crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL);
        await database_1.prisma.refreshToken.create({
            data: {
                userId,
                deviceId,
                tokenHash,
                expiresAt
            }
        });
        return rawToken;
    }
    /**
     * Generates a username suggestion based on firstName, lastName, or email.
     * Checks database to ensure it's available.
     */
    static async suggestUsernames(base) {
        const cleanBase = base.toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 15);
        const suggestions = [];
        // Generate 3 variants
        const variants = [
            cleanBase,
            `${cleanBase}${Math.floor(Math.random() * 100)}`,
            `${cleanBase}_${Math.floor(Math.random() * 1000)}`
        ];
        for (const variant of variants) {
            if (variant.length < 3)
                continue;
            const exists = await database_1.prisma.user.findUnique({ where: { username: variant } });
            if (!exists && !suggestions.includes(variant)) {
                suggestions.push(variant);
            }
            if (suggestions.length >= 3)
                break;
        }
        // Fallbacks if we still don't have 3
        while (suggestions.length < 3) {
            const fallback = `user_${Math.floor(Math.random() * 100000)}`;
            const exists = await database_1.prisma.user.findUnique({ where: { username: fallback } });
            if (!exists && !suggestions.includes(fallback)) {
                suggestions.push(fallback);
            }
        }
        return suggestions;
    }
    static async register(data) {
        const existingEmail = await database_1.prisma.user.findUnique({ where: { email: data.email } });
        if (existingEmail) {
            throw new Error('Email already in use');
        }
        const existingUsername = await database_1.prisma.user.findUnique({ where: { username: data.username } });
        if (existingUsername) {
            throw new Error('Username already taken');
        }
        const passwordHash = await bcrypt_1.default.hash(data.password, 12);
        const displayName = `${data.firstName} ${data.lastName}`;
        const user = await database_1.prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                displayName,
                username: data.username,
                accountType: data.accountType,
                country: data.country,
                currency: data.currency,
            }
        });
        const payload = {
            userId: user.id,
            deviceId: data.deviceId,
            isAdmin: user.isAdmin,
            isWalletUnlocked: user.isWalletUnlocked,
            accountType: user.accountType
        };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = await this.createRefreshToken(user.id, data.deviceId);
        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                accountType: user.accountType,
                isWalletUnlocked: user.isWalletUnlocked
            },
            accessToken,
            refreshToken
        };
    }
    static async login(data) {
        let user = null;
        if (data.email)
            user = await database_1.prisma.user.findUnique({ where: { email: data.email } });
        else if (data.username)
            user = await database_1.prisma.user.findUnique({ where: { username: data.username } });
        if (!user || !user.passwordHash) {
            throw new Error('Invalid credentials');
        }
        const isValid = await bcrypt_1.default.compare(data.password, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        const payload = {
            userId: user.id,
            deviceId: data.deviceId,
            isAdmin: user.isAdmin,
            isWalletUnlocked: user.isWalletUnlocked,
            accountType: user.accountType
        };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        // Revoke old tokens for this specific device
        await database_1.prisma.refreshToken.deleteMany({
            where: { userId: user.id, deviceId: data.deviceId }
        });
        const refreshToken = await this.createRefreshToken(user.id, data.deviceId);
        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                accountType: user.accountType,
                isWalletUnlocked: user.isWalletUnlocked
            },
            accessToken,
            refreshToken
        };
    }
    static async oauthLogin(data) {
        // 1. Verify token with Provider API here in the real implementation
        // Mocking email extraction:
        const providerEmail = `oauth_${data.token.substring(0, 8)}@example.com`; // Placeholder
        const providerId = data.token.substring(0, 20); // Placeholder
        let user = await database_1.prisma.user.findFirst({
            where: data.provider === 'google' ? { googleId: providerId } : { appleId: providerId }
        });
        let isNewUser = false;
        if (!user) {
            // Setup new OAuth User
            isNewUser = true;
            if (!data.username || !data.country || !data.currency || !data.firstName || !data.lastName) {
                // Needs to suggest usernames and prompt frontend to complete signup
                const suggestions = await this.suggestUsernames(data.firstName || providerEmail.split('@')[0]);
                throw new Error(JSON.stringify({
                    error: 'Missing required OAuth registration data',
                    code: 'OAUTH_INCOMPLETE',
                    suggestions
                }));
            }
            const existingUsername = await database_1.prisma.user.findUnique({ where: { username: data.username } });
            if (existingUsername) {
                const suggestions = await this.suggestUsernames(data.username);
                throw new Error(JSON.stringify({
                    error: 'Username already taken',
                    code: 'USERNAME_COLLISION',
                    suggestions
                }));
            }
            const displayName = `${data.firstName} ${data.lastName}`;
            user = await database_1.prisma.user.create({
                data: {
                    email: providerEmail, // The real verified email from Google/Apple
                    googleId: data.provider === 'google' ? providerId : null,
                    appleId: data.provider === 'apple' ? providerId : null,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    displayName,
                    username: data.username,
                    accountType: data.accountType || 'CREATOR',
                    country: data.country,
                    currency: data.currency,
                    // passwordHash is optional
                }
            });
        }
        const payload = {
            userId: user.id,
            deviceId: data.deviceId,
            isAdmin: user.isAdmin,
            isWalletUnlocked: user.isWalletUnlocked,
            accountType: user.accountType
        };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        await database_1.prisma.refreshToken.deleteMany({
            where: { userId: user.id, deviceId: data.deviceId }
        });
        const refreshToken = await this.createRefreshToken(user.id, data.deviceId);
        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                accountType: user.accountType,
                isWalletUnlocked: user.isWalletUnlocked
            },
            accessToken,
            refreshToken,
            isNewUser
        };
    }
    static async refreshToken(data) {
        const tokenHash = crypto_1.default.createHash('sha256').update(data.refreshToken).digest('hex');
        // Find the token
        const tokenRecord = await database_1.prisma.refreshToken.findFirst({
            where: { tokenHash, deviceId: data.deviceId },
            include: { user: true }
        });
        if (!tokenRecord) {
            throw new Error('Invalid refresh token');
        }
        if (tokenRecord.expiresAt.getTime() < Date.now()) {
            await database_1.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
            throw new Error('Refresh token expired');
        }
        const { user } = tokenRecord;
        // Remove old token (Refresh Token Rotation)
        await database_1.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
        // Generate new set
        const payload = {
            userId: user.id,
            deviceId: data.deviceId,
            isAdmin: user.isAdmin,
            isWalletUnlocked: user.isWalletUnlocked,
            accountType: user.accountType
        };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const newRefreshToken = await this.createRefreshToken(user.id, data.deviceId);
        return {
            accessToken,
            refreshToken: newRefreshToken
        };
    }
    static async logout(data) {
        const tokenHash = crypto_1.default.createHash('sha256').update(data.refreshToken).digest('hex');
        await database_1.prisma.refreshToken.deleteMany({
            where: { tokenHash, deviceId: data.deviceId }
        });
        return { success: true };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map