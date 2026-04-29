import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Hashes a wallet PIN using bcrypt with 12 salt rounds
 * @param pin - The plain text PIN (4-6 digits)
 * @returns Promise<string> - The hashed PIN
 */
export async function hashWalletPin(pin: string): Promise<string> {
  if (!pin || pin.length < 4 || pin.length > 6) {
    throw new Error('PIN must be 4-6 digits');
  }
  
  if (!/^\d+$/.test(pin)) {
    throw new Error('PIN must contain only digits');
  }
  
  return bcrypt.hash(pin, SALT_ROUNDS);
}

/**
 * Verifies a wallet PIN against its hash
 * @param pin - The plain text PIN to verify
 * @param hash - The stored hash to compare against
 * @returns Promise<boolean> - True if PIN matches
 */
export async function verifyWalletPin(pin: string, hash: string): Promise<boolean> {
  if (!pin || !hash) {
    return false;
  }
  
  return bcrypt.compare(pin, hash);
}

/**
 * Checks if a PIN hash needs rehashing (if salt rounds changed)
 * @param hash - The stored hash
 * @returns boolean - True if rehashing is needed
 */
export function needsRehash(hash: string): boolean {
  try {
    const rounds = bcrypt.getRounds(hash);
    return rounds < SALT_ROUNDS;
  } catch {
    return true;
  }
}
