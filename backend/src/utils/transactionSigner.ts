import crypto from 'crypto';

// Transaction signing configuration
const SIGNATURE_ALGORITHM = 'sha256';
const SIGNATURE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export interface TransactionPayload {
  userId: string;
  amountKr: number;
  provider: string;
  accountName: string;
  accountDetails: any;
  currency: string;
  timestamp: number;
  nonce: string;
}

export class TransactionSigner {
  private secretKey: string;

  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.TRANSACTION_SIGNING_SECRET || '';
    
    if (!this.secretKey) {
      throw new Error('TRANSACTION_SIGNING_SECRET environment variable is required');
    }
  }

  /**
   * Create a cryptographic signature for a transaction
   * Uses HMAC-SHA256 to create a tamper-proof seal
   */
  sign(payload: TransactionPayload): string {
    // Create canonical string from payload (order matters!)
    const canonicalString = this.createCanonicalString(payload);
    
    // Create HMAC signature
    const hmac = crypto.createHmac(SIGNATURE_ALGORITHM, this.secretKey);
    hmac.update(canonicalString);
    
    return hmac.digest('hex');
  }

  /**
   * Verify a transaction signature
   * Returns true if signature is valid and not expired
   */
  verify(payload: TransactionPayload, signature: string): {
    valid: boolean;
    error?: string;
  } {
    // Check timestamp (prevent replay attacks)
    const now = Date.now();
    const age = now - payload.timestamp;

    if (age > SIGNATURE_EXPIRY_MS) {
      return {
        valid: false,
        error: 'Transaction signature expired. Please try again.'
      };
    }

    if (age < 0) {
      return {
        valid: false,
        error: 'Transaction timestamp is in the future. Invalid request.'
      };
    }

    // Compute expected signature
    const expectedSignature = this.sign(payload);

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValid) {
      return {
        valid: false,
        error: 'Invalid transaction signature. Request may have been tampered with.'
      };
    }

    return { valid: true };
  }

  /**
   * Create a canonical string representation of the payload
   * Order is critical - any change breaks the signature
   */
  private createCanonicalString(payload: TransactionPayload): string {
    return [
      payload.userId,
      payload.amountKr.toString(),
      payload.provider,
      payload.accountName,
      JSON.stringify(payload.accountDetails),
      payload.currency,
      payload.timestamp.toString(),
      payload.nonce
    ].join('|');
  }

  /**
   * Generate a cryptographically secure nonce
   * Prevents replay attacks by ensuring each request is unique
   */
  static generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}

// Singleton instance
export const transactionSigner = new TransactionSigner();
