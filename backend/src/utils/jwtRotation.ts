import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/database.js';

interface JwtSecretVersion {
  version: number;
  secret: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * JWT Secret Rotation Manager
 * Supports multiple active secrets for graceful rotation
 */
export class JwtSecretManager {
  private static instance: JwtSecretManager;
  private secrets: Map<number, JwtSecretVersion> = new Map();
  private currentVersion: number = 1;

  private constructor() {}

  static getInstance(): JwtSecretManager {
    if (!JwtSecretManager.instance) {
      JwtSecretManager.instance = new JwtSecretManager();
    }
    return JwtSecretManager.instance;
  }

  /**
   * Initialize secrets from database
   */
  async initialize(): Promise<void> {
    const config = await prisma.platform_config.findUnique({
      where: { key: 'jwt_secrets' }
    });

    if (config) {
      const secretsData = config.value as any;
      this.currentVersion = secretsData.currentVersion;
      
      for (const secret of secretsData.secrets) {
        this.secrets.set(secret.version, {
          version: secret.version,
          secret: secret.secret,
          createdAt: new Date(secret.created_at),
          expiresAt: new Date(secret.expires_at)
        });
      }
    } else {
      // Initialize with current secret from env
      await this.addSecret(env.JWT_ACCESS_SECRET);
    }
  }

  /**
   * Get current active secret for signing new tokens
   */
  getCurrentSecret(): string {
    const secret = this.secrets.get(this.currentVersion);
    if (!secret) {
      throw new Error('No active JWT secret found');
    }
    return secret.secret;
  }

  /**
   * Get current version number
   */
  getCurrentVersion(): number {
    return this.currentVersion;
  }

  /**
   * Verify token with any valid secret (current or previous)
   */
  verifyToken(token: string): any {
    let lastError: Error | null = null;

    // Try current version first
    const currentSecret = this.secrets.get(this.currentVersion);
    if (currentSecret) {
      try {
        return jwt.verify(token, currentSecret.secret);
      } catch (error) {
        lastError = error as Error;
      }
    }

    // Try previous versions
    for (const [version, secretData] of this.secrets.entries()) {
      if (version === this.currentVersion) continue;
      
      // Skip expired secrets
      if (new Date() > secretData.expiresAt) continue;

      try {
        return jwt.verify(token, secretData.secret);
      } catch (error) {
        lastError = error as Error;
      }
    }

    throw lastError || new Error('Token verification failed');
  }

  /**
   * Add new secret and rotate
   */
  async rotateSecret(newSecret: string): Promise<void> {
    const newVersion = this.currentVersion + 1;
    await this.addSecret(newSecret, newVersion);
    this.currentVersion = newVersion;
    await this.persistSecrets();
  }

  /**
   * Add a new secret version
   */
  private async addSecret(secret: string, version?: number): Promise<void> {
    const ver = version || this.currentVersion;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    this.secrets.set(ver, {
      version: ver,
      secret,
      createdAt: now,
      expiresAt
    });

    await this.persistSecrets();
  }

  /**
   * Persist secrets to database
   */
  private async persistSecrets(): Promise<void> {
    const secretsArray = Array.from(this.secrets.values()).map(s => ({
      version: s.version,
      secret: s.secret,
      created_at: s.createdAt.toISOString(),
      expires_at: s.expiresAt.toISOString()
    }));

    await prisma.platform_config.upsert({
      where: { key: 'jwt_secrets' },
      create: {
        key: 'jwt_secrets',
        value: {
          currentVersion: this.currentVersion,
          secrets: secretsArray
        }
      },
      update: {
        value: {
          currentVersion: this.currentVersion,
          secrets: secretsArray
        }
      }
    });
  }

  /**
   * Clean up expired secrets
   */
  async cleanupExpiredSecrets(): Promise<void> {
    const now = new Date();
    let hasChanges = false;

    for (const [version, secret] of this.secrets.entries()) {
      if (now > secret.expiresAt && version !== this.currentVersion) {
        this.secrets.delete(version);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await this.persistSecrets();
    }
  }

  /**
   * Check if rotation is needed (secret older than 90 days)
   */
  needsRotation(): boolean {
    const currentSecret = this.secrets.get(this.currentVersion);
    if (!currentSecret) return true;

    const daysSinceCreation = (Date.now() - currentSecret.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation > 90;
  }
}

// Export singleton instance
export const jwtSecretManager = JwtSecretManager.getInstance();
