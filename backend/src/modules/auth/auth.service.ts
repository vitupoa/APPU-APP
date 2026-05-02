import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database.js';
import { generateAccessToken, JwtPayload } from '../../utils/jwt.js';
import { env } from '../../config/env.js';
import crypto from 'crypto';

// Parse JWT_REFRESH_EXPIRY from env (e.g., '365d' -> milliseconds)
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 365 * 24 * 60 * 60 * 1000; // Default 365 days
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 365 * 24 * 60 * 60 * 1000;
  }
}

const REFRESH_TOKEN_TTL = parseExpiry(env.JWT_REFRESH_EXPIRY || '365d');

export class AuthService {
  /**
   * Helper to generate a unique refresh token, hash it, and store it
   */
  private static async createRefreshToken(userId: string, deviceId: string) {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL);

    await prisma.refreshToken.create({
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
  static async suggestUsernames(base: string): Promise<string[]> {
    const cleanBase = base.toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 15);
    const suggestions: string[] = [];
    
    // Generate 3 variants
    const variants = [
      cleanBase,
      `${cleanBase}${Math.floor(Math.random() * 100)}`,
      `${cleanBase}_${Math.floor(Math.random() * 1000)}`
    ];

    for (const variant of variants) {
      if (variant.length < 3) continue;
      const exists = await prisma.user.findUnique({ where: { username: variant } });
      if (!exists && !suggestions.includes(variant)) {
        suggestions.push(variant);
      }
      if (suggestions.length >= 3) break;
    }

    // Fallbacks if we still don't have 3
    while (suggestions.length < 3) {
      const fallback = `user_${Math.floor(Math.random() * 100000)}`;
      const exists = await prisma.user.findUnique({ where: { username: fallback } });
      if (!exists && !suggestions.includes(fallback)) {
        suggestions.push(fallback);
      }
    }

    return suggestions;
  }

  static async processAutoAdmire(newUserId: string) {
    try {
      const config = await prisma.platformConfig.findUnique({ where: { key: 'AUTO_ADMIRE_USERS' } });
      if (config && Array.isArray(config.value)) {
        const userIds = config.value as string[];
        if (userIds.length > 0) {
          const admireRecords = userIds.map((admiredId: any) => ({
            admirerId: newUserId,
            admiredId
          }));
          await prisma.admire.createMany({
            data: admireRecords,
            skipDuplicates: true
          });
        }
      }
    } catch (err) {
      console.error('Failed to process auto-admire:', err);
    }
  }

  static async register(data: any) {
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) {
      throw new Error('Email already in use');
    }

    const existingUsername = await prisma.user.findUnique({ where: { username: data.username } });
    if (existingUsername) {
      throw new Error('Username already taken');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const displayName = `${data.firstName} ${data.lastName}`;

    const user = await prisma.user.create({
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

    await this.processAutoAdmire(user.id);

    const payload: JwtPayload = {
      userId: user.id,
      deviceId: data.deviceId,
      isAdmin: user.isAdmin,
      isWalletUnlocked: user.isWalletUnlocked,
      accountType: user.accountType
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = await this.createRefreshToken(user.id, data.deviceId);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        country: user.country,
        currency: user.currency,
        accountType: user.accountType,
        isVerified: user.isVerified,
        isWalletUnlocked: user.isWalletUnlocked,
        createdAt: user.createdAt
      },
      accessToken,
      refreshToken
    };
  }

  static async login(data: any) {
    let user = null;
    
    if (data.email) {
      const emailLower = data.email.toLowerCase();
      user = await prisma.user.findFirst({ where: { email: emailLower } });
      if (!user) {
        // Fallback for insensitive check if database allows it or for differently cased registrations
        user = await prisma.user.findFirst({ where: { email: { equals: data.email, mode: 'insensitive' } } }) || 
               await prisma.user.findFirst({ where: { email: data.email } });
      }
    } else if (data.username) {
      user = await prisma.user.findFirst({ where: { username: { equals: data.username, mode: 'insensitive' } } }) ||
             await prisma.user.findUnique({ where: { username: data.username } });
    }

    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const payload: JwtPayload = {
      userId: user.id,
      deviceId: data.deviceId,
      isAdmin: user.isAdmin,
      isWalletUnlocked: user.isWalletUnlocked,
      accountType: user.accountType
    };

    const accessToken = generateAccessToken(payload);
    
    // Revoke old tokens for this specific device
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id, deviceId: data.deviceId }
    });

    const refreshToken = await this.createRefreshToken(user.id, data.deviceId);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        country: user.country,
        currency: user.currency,
        accountType: user.accountType,
        isVerified: user.isVerified,
        isWalletUnlocked: user.isWalletUnlocked,
        createdAt: user.createdAt
      },
      accessToken,
      refreshToken
    };
  }

  static async oauthLogin(data: any) {
    // 1. Verify token with Provider API here in the real implementation
    // Mocking email extraction:
    const providerEmail = `oauth_${data.token.substring(0, 8)}@example.com`; // Placeholder
    const providerId = data.token.substring(0, 20); // Placeholder

    let user = await prisma.user.findFirst({
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

      const existingUsername = await prisma.user.findUnique({ where: { username: data.username } });
      if (existingUsername) {
        const suggestions = await this.suggestUsernames(data.username);
        throw new Error(JSON.stringify({
          error: 'Username already taken',
          code: 'USERNAME_COLLISION',
          suggestions
        }));
      }

      const displayName = `${data.firstName} ${data.lastName}`;
      user = await prisma.user.create({
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
      await this.processAutoAdmire(user.id);
    }

    const payload: JwtPayload = {
      userId: user.id,
      deviceId: data.deviceId,
      isAdmin: user.isAdmin,
      isWalletUnlocked: user.isWalletUnlocked,
      accountType: user.accountType
    };

    const accessToken = generateAccessToken(payload);
    
    await prisma.refreshToken.deleteMany({
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

  static async refreshToken(data: { refreshToken: string; deviceId: string }) {
    const tokenHash = crypto.createHash('sha256').update(data.refreshToken).digest('hex');
    
    // Find the token
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: { tokenHash, deviceId: data.deviceId },
      include: { user: true }
    });

    if (!tokenRecord) {
      throw new Error('Invalid refresh token');
    }

    if (tokenRecord.expiresAt.getTime() < Date.now()) {
      await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      throw new Error('Refresh token expired');
    }

    const { user } = tokenRecord;

    // Remove old token (Refresh Token Rotation)
    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    // Generate new set
    const payload: JwtPayload = {
      userId: user.id,
      deviceId: data.deviceId,
      isAdmin: user.isAdmin,
      isWalletUnlocked: user.isWalletUnlocked,
      accountType: user.accountType
    };

    const accessToken = generateAccessToken(payload);
    const newRefreshToken = await this.createRefreshToken(user.id, data.deviceId);

    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  static async logout(data: { refreshToken: string; deviceId: string }) {
    const tokenHash = crypto.createHash('sha256').update(data.refreshToken).digest('hex');
    await prisma.refreshToken.deleteMany({
      where: { tokenHash, deviceId: data.deviceId }
    });
    return { success: true };
  }
}
