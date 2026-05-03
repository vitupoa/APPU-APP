import crypto from 'crypto';

export class WithdrawalSecurityValidator {
  private static readonly SECURITY_SALT = 'KRIETA_WITHDRAWAL_SECURITY_2024';
  
  /**
   * Generate a secure hash for the withdrawal amount
   */
  static generateAmountHash(
    userId: string,
    amount: number,
    timestamp: number,
    nonce: string
  ): string {
    const data = `${userId}:${amount}:${timestamp}:${nonce}:${this.SECURITY_SALT}`;
    return this.hashString(data);
  }
  
  /**
   * Generate a secure hash for the user's balance
   */
  static generateBalanceHash(
    userId: string,
    balance: number,
    timestamp: number
  ): string {
    const data = `${userId}:${balance}:${timestamp}:${this.SECURITY_SALT}`;
    return this.hashString(data);
  }
  
  /**
   * Validate that the amount hash matches the expected value
   */
  static validateAmountHash(
    userId: string,
    amount: number,
    timestamp: number,
    providedHash: string,
    nonce: string
  ): boolean {
    const expectedHash = this.generateAmountHash(userId, amount, timestamp, nonce);
    return expectedHash === providedHash;
  }
  
  /**
   * Validate that the balance hash matches the expected value
   */
  static validateBalanceHash(
    userId: string,
    balance: number,
    timestamp: number,
    providedHash: string
  ): boolean {
    const expectedHash = this.generateBalanceHash(userId, balance, timestamp);
    return expectedHash === providedHash;
  }
  
  /**
   * Comprehensive withdrawal amount validation
   */
  static validateWithdrawalAmount(
    requestedAmount: number,
    availableBalance: number,
    minAmount: number = 100.0,
    maxAmount: number = 30000.0 // Maximum per single transaction
  ): { isValid: boolean; message: string } {
    // Check if amount is positive
    if (requestedAmount <= 0) {
      return { isValid: false, message: 'Withdrawal amount must be greater than 0' };
    }
    
    // Check minimum amount
    if (requestedAmount < minAmount) {
      return { isValid: false, message: `Minimum withdrawal amount is ${minAmount} Kr` };
    }
    
    // Check maximum amount
    if (requestedAmount > maxAmount) {
      return { isValid: false, message: `Maximum withdrawal amount is ${maxAmount} Kr` };
    }
    
    // Check if amount is a valid number
    if (!Number.isFinite(requestedAmount)) {
      return { isValid: false, message: 'Invalid withdrawal amount' };
    }
    
    // Check if user has sufficient balance
    if (requestedAmount > availableBalance) {
      return { 
        isValid: false, 
        message: `Insufficient balance. Available: ${availableBalance} Kr, Requested: ${requestedAmount} Kr` 
      };
    }
    
    // Check for reasonable decimal precision (max 2 decimal places)
    const rounded = Math.round(requestedAmount * 100) / 100;
    if (Math.abs(requestedAmount - rounded) > 0.001) {
      return { isValid: false, message: 'Amount can have maximum 2 decimal places' };
    }
    
    return { isValid: true, message: 'Amount validation passed' };
  }
  
  /**
   * Validate request timestamp to prevent replay attacks
   */
  static validateTimestamp(timestamp: number, maxAgeMinutes: number = 5): boolean {
    const currentTime = Date.now();
    const maxAge = maxAgeMinutes * 60 * 1000;
    return (currentTime - timestamp) <= maxAge && timestamp <= currentTime;
  }
  
  /**
   * Validate that the withdrawal request hasn't been tampered with
   */
  static validateRequestIntegrity(
    userId: string,
    amount: number,
    timestamp: number,
    amountHash: string,
    balanceHash: string,
    nonce: string,
    userBalance: number
  ): { isValid: boolean; message: string } {
    // Validate timestamp
    if (!this.validateTimestamp(timestamp)) {
      return { isValid: false, message: 'Request timestamp is invalid or expired' };
    }
    
    // Validate amount hash
    if (!this.validateAmountHash(userId, amount, timestamp, amountHash, nonce)) {
      return { isValid: false, message: 'Amount validation failed - possible tampering detected' };
    }
    
    // Validate balance hash
    if (!this.validateBalanceHash(userId, userBalance, timestamp, balanceHash)) {
      return { isValid: false, message: 'Balance validation failed - please refresh and try again' };
    }
    
    return { isValid: true, message: 'Request integrity validated' };
  }
  
  /**
   * Sanitize and validate numeric input
   */
  static sanitizeAmount(input: any): number | null {
    if (typeof input === 'number') {
      return Number.isFinite(input) ? input : null;
    }
    
    if (typeof input === 'string') {
      // Remove any non-numeric characters except decimal point
      const sanitized = input.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(sanitized);
      return Number.isFinite(parsed) ? parsed : null;
    }
    
    return null;
  }
  
  /**
   * Simple hash function (matches frontend implementation)
   */
  private static hashString(input: string): string {
    // Use HMAC-SHA256 for cryptographic security
    const secret = process.env.REQUEST_SIGNING_KEY || this.SECURITY_SALT;
    return crypto.createHmac('sha256', secret)
      .update(input)
      .digest('hex');
  }
}