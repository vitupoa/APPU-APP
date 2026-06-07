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

    await prisma.refresh_tokens.create({
      data: {
        user_id: userId,
        device_id: deviceId,
        token_hash: tokenHash,
        expires_at: expiresAt
      }
    } as any);

    return rawToken;
  }

  /**
   * Generates a username suggestion based on firstName, last_name, or email.
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
      const config = await prisma.platform_config.findUnique({ where: { key: 'AUTO_ADMIRE_USERS' } });
      if (config && Array.isArray(config.value)) {
        const userIds = config.value as string[];
        if (userIds.length > 0) {
          const admireRecords = userIds.map((admiredId: any) => ({
            admirer_id: newUserId,
            admired_id: admiredId
          }));
          await prisma.admires.createMany({
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
    const displayName = `${data.first_name} ${data.last_name}`;

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: data.email,
        password_hash: passwordHash,
        first_name: data.first_name,
        last_name: data.last_name,
        display_name: displayName,
        username: data.username,
        account_type: data.account_type,
        country: data.country,
        currency: data.currency,
        selectedNiches: data.selectedNiches || [],
        customNiches: data.customNiches || [],
        updated_at: new Date()
      }
    } as any);

    await this.processAutoAdmire(user.id);

    const payload: JwtPayload = {
      user_id: user.id,
      deviceId: data.device_id,
      is_admin: user.is_admin,
      is_wallet_unlocked: user.is_wallet_unlocked,
      account_type: user.account_type
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = await this.createRefreshToken(user.id, data.device_id);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        display_name: user.display_name,
        country: user.country,
        currency: user.currency,
        account_type: user.account_type,
        is_verified: user.is_verified,
        is_wallet_unlocked: user.is_wallet_unlocked,
        created_at: user.created_at
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

    if (!user || !user.password_hash) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const payload: JwtPayload = {
      user_id: user.id,
      deviceId: data.device_id,
      is_admin: user.is_admin,
      is_wallet_unlocked: user.is_wallet_unlocked,
      account_type: user.account_type
    };

    const accessToken = generateAccessToken(payload);
    
    // Revoke old tokens for this specific device
    await prisma.refresh_tokens.deleteMany({
      where: { user_id: user.id, device_id: data.device_id }
    });

    const refreshToken = await this.createRefreshToken(user.id, data.device_id);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        display_name: user.display_name,
        country: user.country,
        currency: user.currency,
        account_type: user.account_type,
        is_verified: user.is_verified,
        is_wallet_unlocked: user.is_wallet_unlocked,
        created_at: user.created_at
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
      where: data.provider === 'google' ? { google_id: providerId } : { apple_id: providerId }
    });

    let isNewUser = false;

    if (!user) {
      // Setup new OAuth User
      isNewUser = true;

      if (!data.username || !data.country || !data.currency || !data.first_name || !data.last_name) {
        // Needs to suggest usernames and prompt frontend to complete signup
        const suggestions = await this.suggestUsernames(data.first_name || providerEmail.split('@')[0]);
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

      const displayName = `${data.first_name} ${data.last_name}`;
      user = await prisma.user.create({
        data: {
          email: providerEmail, // The real verified email from Google/Apple
          google_id: data.provider === 'google' ? providerId : null,
          apple_id: data.provider === 'apple' ? providerId : null,
          first_name: data.first_name,
          last_name: data.last_name,
          display_name: displayName,
          username: data.username,
          account_type: data.account_type || 'CREATOR',
          country: data.country,
          currency: data.currency,
          updated_at: new Date()
          // passwordHash is optional
        }
      } as any);
      await this.processAutoAdmire(user.id);
    }

    const payload: JwtPayload = {
      user_id: user.id,
      deviceId: data.device_id,
      is_admin: user.is_admin,
      is_wallet_unlocked: user.is_wallet_unlocked,
      account_type: user.account_type
    };

    const accessToken = generateAccessToken(payload);
    
    await prisma.refresh_tokens.deleteMany({
      where: { user_id: user.id, device_id: data.device_id }
    });

    const refreshToken = await this.createRefreshToken(user.id, data.device_id);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        account_type: user.account_type,
        is_wallet_unlocked: user.is_wallet_unlocked
      },
      accessToken,
      refreshToken,
      isNewUser
    };
  }

  static async refreshToken(data: { refresh_token: string; deviceId: string }) {
    const tokenHash = crypto.createHash('sha256').update(data.refresh_token).digest('hex');
    
    // Find the token
    const tokenRecord = await prisma.refresh_tokens.findFirst({
      where: { token_hash: tokenHash, device_id: data.deviceId },
      include: { user: true }
    });

    if (!tokenRecord) {
      throw new Error('Invalid refresh token');
    }

    if (tokenRecord.expires_at.getTime() < Date.now()) {
      await prisma.refresh_tokens.delete({ where: { id: tokenRecord.id } });
      throw new Error('Refresh token expired');
    }

    const { User: user } = tokenRecord;

    // Remove old token (Refresh Token Rotation)
    await prisma.refresh_tokens.delete({ where: { id: tokenRecord.id } });

    // Generate new set
    const payload: JwtPayload = {
      user_id: user.id,
      deviceId: data.deviceId,
      is_admin: user.is_admin,
      is_wallet_unlocked: user.is_wallet_unlocked,
      account_type: user.account_type
    };

    const accessToken = generateAccessToken(payload);
    const newRefreshToken = await this.createRefreshToken(user.id, data.deviceId);

    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  static async logout(data: { refresh_token: string; deviceId: string }) {
    const tokenHash = crypto.createHash('sha256').update(data.refresh_token).digest('hex');
    await prisma.refresh_tokens.deleteMany({
      where: { token_hash: tokenHash, device_id: data.deviceId }
    });
    return { success: true };
  }
}
