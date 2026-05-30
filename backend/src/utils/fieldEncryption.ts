import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Field-Level Encryption Service
 * 
 * Encrypts sensitive fields at application level before storing in database.
 * Uses AES-256-GCM with unique IV per field for maximum security.
 * 
 * CRITICAL: This protects sensitive data even if database is compromised.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Derive encryption key from master key
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt a field value
 */
export function encryptField(plaintext: string, fieldName: string): string {
  if (!plaintext) return plaintext;
  
  // Generate unique salt for this field
  const salt = crypto.randomBytes(32);
  const key = deriveKey(env.FIELD_ENCRYPTION_KEY || env.ENCRYPTION_KEY, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: salt:iv:authTag:encrypted
  return Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'hex')
  ]).toString('base64');
}

/**
 * Decrypt a field value
 */
export function decryptField(encryptedData: string, fieldName: string): string {
  if (!encryptedData) return encryptedData;
  
  try {
    const buffer = Buffer.from(encryptedData, 'base64');
    
    const salt = buffer.subarray(0, 32);
    const iv = buffer.subarray(32, 32 + IV_LENGTH);
    const authTag = buffer.subarray(32 + IV_LENGTH, 32 + IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buffer.subarray(32 + IV_LENGTH + AUTH_TAG_LENGTH);
    
    const key = deriveKey(env.FIELD_ENCRYPTION_KEY || env.ENCRYPTION_KEY, salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error(`Failed to decrypt field ${fieldName}:`, error);
    throw new Error('Decryption failed');
  }
}

/**
 * Encrypt sensitive user data
 */
export interface SensitiveUserData {
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  passportNumber?: string;
  driversLicense?: string;
  bankAccountNumber?: string;
  mpesaNumber?: string;
  paystackCustomerId?: string;
}

export function encryptUserData(data: SensitiveUserData): SensitiveUserData {
  const encrypted: SensitiveUserData = {};
  
  if (data.email) encrypted.email = encryptField(data.email, 'email');
  if (data.phoneNumber) encrypted.phoneNumber = encryptField(data.phoneNumber, 'phoneNumber');
  if (data.firstName) encrypted.firstName = encryptField(data.firstName, 'firstName');
  if (data.lastName) encrypted.lastName = encryptField(data.lastName, 'lastName');
  if (data.nationalId) encrypted.nationalId = encryptField(data.nationalId, 'nationalId');
  if (data.passportNumber) encrypted.passportNumber = encryptField(data.passportNumber, 'passportNumber');
  if (data.driversLicense) encrypted.driversLicense = encryptField(data.driversLicense, 'driversLicense');
  if (data.bankAccountNumber) encrypted.bankAccountNumber = encryptField(data.bankAccountNumber, 'bankAccountNumber');
  if (data.mpesaNumber) encrypted.mpesaNumber = encryptField(data.mpesaNumber, 'mpesaNumber');
  if (data.paystackCustomerId) encrypted.paystackCustomerId = encryptField(data.paystackCustomerId, 'paystackCustomerId');
  
  return encrypted;
}

export function decryptUserData(data: SensitiveUserData): SensitiveUserData {
  const decrypted: SensitiveUserData = {};
  
  if (data.email) decrypted.email = decryptField(data.email, 'email');
  if (data.phoneNumber) decrypted.phoneNumber = decryptField(data.phoneNumber, 'phoneNumber');
  if (data.firstName) decrypted.firstName = decryptField(data.firstName, 'firstName');
  if (data.lastName) decrypted.lastName = decryptField(data.lastName, 'lastName');
  if (data.nationalId) decrypted.nationalId = decryptField(data.nationalId, 'nationalId');
  if (data.passportNumber) decrypted.passportNumber = decryptField(data.passportNumber, 'passportNumber');
  if (data.driversLicense) decrypted.driversLicense = decryptField(data.driversLicense, 'driversLicense');
  if (data.bankAccountNumber) decrypted.bankAccountNumber = decryptField(data.bankAccountNumber, 'bankAccountNumber');
  if (data.mpesaNumber) decrypted.mpesaNumber = decryptField(data.mpesaNumber, 'mpesaNumber');
  if (data.paystackCustomerId) decrypted.paystackCustomerId = decryptField(data.paystackCustomerId, 'paystackCustomerId');
  
  return decrypted;
}

/**
 * Hash sensitive data for searching (one-way)
 */
export function hashForSearch(value: string): string {
  return crypto
    .createHash('sha256')
    .update(value.toLowerCase().trim())
    .digest('hex');
}

/**
 * Mask sensitive data for display
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.substring(0, 2)}***@${domain}`;
}

export function maskPhone(phone: string): string {
  if (phone.length <= 4) return '***' + phone.slice(-2);
  return '***' + phone.slice(-4);
}

export function maskAccountNumber(account: string): string {
  if (account.length <= 4) return '***' + account.slice(-2);
  return '***' + account.slice(-4);
}

export function maskNationalId(id: string): string {
  if (id.length <= 4) return '***' + id.slice(-2);
  return id.substring(0, 2) + '***' + id.slice(-2);
}

/**
 * Remove sensitive fields from API responses
 */
export function sanitizeUserResponse(user: any): any {
  const sanitized = { ...user };
  
  // Remove sensitive fields
  delete sanitized.password_hash;
  delete sanitized.wallet_pin_hash;
  delete sanitized.google_id;
  delete sanitized.apple_id;
  delete sanitized.fcmToken;
  
  // Mask PII if present
  if (sanitized.email) sanitized.email = maskEmail(sanitized.email);
  if (sanitized.phoneNumber) sanitized.phoneNumber = maskPhone(sanitized.phoneNumber);
  
  return sanitized;
}

export function sanitizeTransactionResponse(transaction: any): any {
  const sanitized = { ...transaction };
  
  // Remove sensitive metadata
  if (sanitized.metadata) {
    delete sanitized.metadata.accountNumber;
    delete sanitized.metadata.phoneNumber;
    delete sanitized.metadata.email;
  }
  
  return sanitized;
}

export function sanitizeWithdrawalResponse(withdrawal: any): any {
  const sanitized = { ...withdrawal };
  
  // Mask account details
  if (sanitized.destination) {
    sanitized.destination = maskAccountNumber(sanitized.destination);
  }
  
  if (sanitized.account_details) {
    if (sanitized.account_details.accountNumber) {
      sanitized.account_details.accountNumber = maskAccountNumber(sanitized.account_details.accountNumber);
    }
    if (sanitized.account_details.phoneNumber) {
      sanitized.account_details.phoneNumber = maskPhone(sanitized.account_details.phoneNumber);
    }
  }
  
  return sanitized;
}

/**
 * Encrypt payment details
 */
export interface PaymentDetails {
  cardNumber?: string;
  cvv?: string;
  accountNumber?: string;
  routingNumber?: string;
  mpesaNumber?: string;
}

export function encryptPaymentDetails(details: PaymentDetails): PaymentDetails {
  const encrypted: PaymentDetails = {};
  
  if (details.cardNumber) encrypted.cardNumber = encryptField(details.cardNumber, 'cardNumber');
  if (details.cvv) encrypted.cvv = encryptField(details.cvv, 'cvv');
  if (details.accountNumber) encrypted.accountNumber = encryptField(details.accountNumber, 'accountNumber');
  if (details.routingNumber) encrypted.routingNumber = encryptField(details.routingNumber, 'routingNumber');
  if (details.mpesaNumber) encrypted.mpesaNumber = encryptField(details.mpesaNumber, 'mpesaNumber');
  
  return encrypted;
}

export function decryptPaymentDetails(details: PaymentDetails): PaymentDetails {
  const decrypted: PaymentDetails = {};
  
  if (details.cardNumber) decrypted.cardNumber = decryptField(details.cardNumber, 'cardNumber');
  if (details.cvv) decrypted.cvv = decryptField(details.cvv, 'cvv');
  if (details.accountNumber) decrypted.accountNumber = decryptField(details.accountNumber, 'accountNumber');
  if (details.routingNumber) decrypted.routingNumber = decryptField(details.routingNumber, 'routingNumber');
  if (details.mpesaNumber) decrypted.mpesaNumber = decryptField(details.mpesaNumber, 'mpesaNumber');
  
  return decrypted;
}
