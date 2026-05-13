import { prisma } from '../config/database.js';

// Nonce expiry time (5 minutes)
const NONCE_EXPIRY_MS = 5 * 60 * 1000;

export class NonceService {
  /**
   * Check if a nonce has been used before
   * Returns true if nonce is fresh (not used)
   */
  async isNonceFresh(nonce: string, userId: string): Promise<boolean> {
    const existing = await prisma.transaction_nonces.findUnique({
      where: { nonce }
    });

    // Nonce already used
    if (existing) {
      return false;
    }

    return true;
  }

  /**
   * Mark a nonce as used
   * Prevents the same transaction from being replayed
   */
  async markNonceUsed(nonce: string, userId: string): Promise<void> {
    const expiresAt = new Date(Date.now() + NONCE_EXPIRY_MS);

    await prisma.transaction_nonces.create({
      data: {
        nonce,
        user_id: userId,
        expires_at: expiresAt
      }
    });
  }

  /**
   * Clean up expired nonces (run periodically)
   */
  async cleanupExpiredNonces(): Promise<number> {
    const result = await prisma.transaction_nonces.deleteMany({
      where: {
        expires_at: {
          lt: new Date()
        }
      }
    });

    return result.count;
  }
}

export const nonceService = new NonceService();
