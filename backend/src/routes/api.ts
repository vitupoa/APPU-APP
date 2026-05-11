// API Routes with Complete Security Implementation
// This file includes authentication and wallet endpoints with all security features

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  generateSessionSecret,
  processTipTransaction,
  verifyWithdrawalSignature,
  verifyTopUpSignature,
  checkRateLimit,
  logFinancialTransaction,
  isNonceUsed,
  isTimestampValid,
  storeNonce
} from './services/financialSecurity';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * POST /api/auth/login
 * Login with session secret generation
 */
router.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password, deviceId } = req.body;
    
    // 1. Authenticate user (implement your auth logic)
    const user = await authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 2. Generate JWT tokens (implement your JWT logic)
    const accessToken = generateJWT(user);
    const refreshToken = generateRefreshToken(user);
    
    // 3. Generate session secret for financial transactions
    const { sessionSecret, secretExpiresAt } = await generateSessionSecret(
      user.id,
      deviceId
    );
    
    // 4. Return response with session secret
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        coverPhotoUrl: user.coverPhotoUrl,
        bio: user.bio,
        country: user.country,
        currency: user.currency,
        accountType: user.accountType,
        isVerified: user.isVerified,
        isWalletUnlocked: user.isWalletUnlocked,
        createdAt: user.createdAt
      },
      accessToken,
      refreshToken,
      sessionSecret,      // ← Client stores this securely
      secretExpiresAt     // ← Client checks expiry
    });
    
    console.log(`✅ User ${user.id} logged in with session secret`);
    
  } catch (error: any) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/register
 * Register with session secret generation
 */
router.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, username, deviceId, ...rest } = req.body;
    
    // 1. Create user (implement your registration logic)
    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
      username,
      ...rest
    });
    
    // 2. Generate JWT tokens
    const accessToken = generateJWT(user);
    const refreshToken = generateRefreshToken(user);
    
    // 3. Generate session secret
    const { sessionSecret, secretExpiresAt } = await generateSessionSecret(
      user.id,
      deviceId
    );
    
    // 4. Return response
    res.json({
      user,
      accessToken,
      refreshToken,
      sessionSecret,
      secretExpiresAt
    });
    
    console.log(`✅ User ${user.id} registered with session secret`);
    
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/logout
 * Logout and deactivate session secret
 */
router.post('/api/auth/logout', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Deactivate all session secrets for this user
    await prisma.userSessionSecret.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    });
    
    console.log(`✅ User ${userId} logged out - session secrets deactivated`);
    
    res.json({ success: true });
    
  } catch (error: any) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ============================================================================
// WALLET ENDPOINTS
// ============================================================================

/**
 * POST /api/wallet/tip
 * Send tip with full security checks
 */
router.post('/api/wallet/tip', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const senderId = req.user.id;
    const { recipientId, krAmount, currency, signature, nonce, timestamp } = req.body;
    
    // Get client info
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const deviceId = req.headers['x-device-id'] as string;
    
    console.log(`💰 Tip request: ${senderId} → ${recipientId}, ${krAmount} Kr`);
    
    // Process transaction with all security checks
    const result = await processTipTransaction({
      senderId,
      recipientId,
      krAmount,
      currency,
      signature,
      nonce,
      timestamp,
      ipAddress,
      userAgent,
      deviceId
    });
    
    res.json(result);
    
  } catch (error: any) {
    console.error('❌ Tip failed:', error.message);
    
    // Return appropriate error
    if (error.message.includes('signature')) {
      return res.status(401).json({ error: error.message });
    }
    if (error.message.includes('nonce') || error.message.includes('timestamp')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Rate limit')) {
      return res.status(429).json({ error: error.message });
    }
    if (error.message.includes('balance')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Transaction failed' });
  }
});

/**
 * POST /api/wallet/withdraw
 * Withdraw funds with full security checks
 */
router.post('/api/wallet/withdraw', authenticateJWT, async (req: Request, res: Response) => {
  const transactionId = crypto.randomUUID();
  
  try {
    const userId = req.user.id;
    const {
      provider,
      krAmount,
      currency,
      phoneNumber,
      accountNumber,
      bankCode,
      accountName,
      country,
      signature,
      nonce,
      timestamp
    } = req.body;
    
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const deviceId = req.headers['x-device-id'] as string;
    
    console.log(`💸 Withdrawal request: ${userId}, ${krAmount} Kr to ${provider}`);
    
    // 1. Verify signature
    const isValid = await verifyWithdrawalSignature({
      userId,
      krAmount,
      provider,
      currency,
      nonce,
      timestamp,
      signature
    });
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    // 2. Check nonce
    if (await isNonceUsed(nonce)) {
      throw new Error('Duplicate request');
    }
    
    // 3. Validate timestamp
    if (!isTimestampValid(timestamp)) {
      throw new Error('Request expired');
    }
    
    // 4. Check rate limit (3 withdrawals per hour)
    await checkRateLimit(userId, 'withdraw', 3, 3600);
    
    // 5. Validate amount
    if (krAmount < 10 || krAmount > 100000) {
      throw new Error('Invalid amount - must be between 10 and 100,000 Kr');
    }
    
    // 6. Check balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });
    
    if (!wallet || Number(wallet.krBalance) < krAmount) {
      throw new Error('Insufficient balance');
    }
    
    // 7. Process withdrawal atomically
    await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { userId },
        data: { krBalance: { decrement: krAmount } }
      });
      
      // Record transaction
      await tx.transaction.create({
        data: {
          id: transactionId,
          userId,
          type: 'WITHDRAW',
          amountKr: krAmount,
          currency,
          provider,
          status: 'PENDING'
        }
      });
      
      // Store nonce
      await tx.transactionNonce.create({
        data: {
          nonce,
          userId,
          transactionType: 'WITHDRAW',
          expiresAt: new Date(timestamp + 10 * 60 * 1000)
        }
      });
    });
    
    // 8. Log transaction
    await logFinancialTransaction({
      transactionId,
      userId,
      transactionType: 'WITHDRAW',
      amountKr: krAmount,
      currency,
      provider,
      signature,
      nonce,
      timestamp,
      ipAddress,
      userAgent,
      deviceId,
      status: 'PENDING'
    });
    
    // 9. Process withdrawal with provider (implement your logic)
    // await processWithdrawalWithProvider(provider, { ... });
    
    console.log(`✅ Withdrawal ${transactionId} initiated`);
    
    res.json({
      success: true,
      transactionId,
      message: 'Withdrawal initiated',
      processingTime: '1-3 business days'
    });
    
  } catch (error: any) {
    console.error('❌ Withdrawal failed:', error.message);
    
    // Log failed transaction
    await logFinancialTransaction({
      transactionId,
      userId: req.user.id,
      transactionType: 'WITHDRAW',
      amountKr: req.body.krAmount,
      currency: req.body.currency,
      provider: req.body.provider,
      signature: req.body.signature,
      nonce: req.body.nonce,
      timestamp: req.body.timestamp,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceId: req.headers['x-device-id'] as string,
      status: 'FAILED',
      errorMessage: error.message
    });
    
    if (error.message.includes('signature')) {
      return res.status(401).json({ error: error.message });
    }
    if (error.message.includes('nonce') || error.message.includes('timestamp')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Rate limit')) {
      return res.status(429).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Withdrawal failed' });
  }
});

/**
 * POST /api/wallet/topup/initiate
 * Initiate top-up with security checks
 */
router.post('/api/wallet/topup/initiate', authenticateJWT, async (req: Request, res: Response) => {
  const transactionId = crypto.randomUUID();
  
  try {
    const userId = req.user.id;
    const {
      fiatAmount,
      currency,
      provider,
      phoneNumber,
      email,
      signature,
      nonce,
      timestamp
    } = req.body;
    
    console.log(`💳 Top-up request: ${userId}, ${fiatAmount} ${currency}`);
    
    // 1. Verify signature
    const isValid = await verifyTopUpSignature({
      userId,
      amount: fiatAmount,
      currency,
      paymentMethod: provider,
      nonce,
      timestamp,
      signature
    });
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    // 2. Check nonce
    if (await isNonceUsed(nonce)) {
      throw new Error('Duplicate request');
    }
    
    // 3. Validate timestamp
    if (!isTimestampValid(timestamp)) {
      throw new Error('Request expired');
    }
    
    // 4. Check rate limit (5 top-ups per hour)
    await checkRateLimit(userId, 'topup', 5, 3600);
    
    // 5. Validate amount
    if (fiatAmount < 5 || fiatAmount > 50000) {
      throw new Error('Invalid amount - must be between 5 and 50,000');
    }
    
    // 6. Calculate Kr amount (implement your exchange rate logic)
    const exchangeRate = await getExchangeRate(currency);
    const krAmount = Math.floor(fiatAmount / exchangeRate.buyRate);
    
    // 7. Store nonce
    await storeNonce(nonce, userId, 'TOPUP', timestamp);
    
    // 8. Generate payment instructions (implement your logic)
    const paymentInstructions = await generatePaymentInstructions({
      provider,
      amount: fiatAmount,
      currency,
      phoneNumber,
      email
    });
    
    // 9. Log transaction
    await logFinancialTransaction({
      transactionId,
      userId,
      transactionType: 'TOPUP',
      amountKr: krAmount,
      amountFiat: fiatAmount,
      currency,
      provider,
      signature,
      nonce,
      timestamp,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceId: req.headers['x-device-id'] as string,
      status: 'PENDING'
    });
    
    console.log(`✅ Top-up ${transactionId} initiated`);
    
    res.json({
      transactionId,
      reference: transactionId,
      krAmount,
      fiatAmount,
      currency,
      provider,
      status: 'PENDING',
      paymentInstructions
    });
    
  } catch (error: any) {
    console.error('❌ Top-up initiation failed:', error.message);
    
    if (error.message.includes('signature')) {
      return res.status(401).json({ error: error.message });
    }
    if (error.message.includes('nonce') || error.message.includes('timestamp')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Rate limit')) {
      return res.status(429).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Top-up initiation failed' });
  }
});

// ============================================================================
// HELPER FUNCTIONS (Implement these based on your app)
// ============================================================================

async function authenticateUser(email: string, password: string) {
  // Implement your authentication logic
  // Return user object or null
  throw new Error('Not implemented');
}

async function createUser(data: any) {
  // Implement your user creation logic
  throw new Error('Not implemented');
}

function generateJWT(user: any): string {
  // Implement your JWT generation
  throw new Error('Not implemented');
}

function generateRefreshToken(user: any): string {
  // Implement your refresh token generation
  throw new Error('Not implemented');
}

function authenticateJWT(req: Request, res: Response, next: any) {
  // Implement your JWT authentication middleware
  // Set req.user with authenticated user
  throw new Error('Not implemented');
}

async function getExchangeRate(currency: string) {
  // Implement your exchange rate logic
  throw new Error('Not implemented');
}

async function generatePaymentInstructions(data: any) {
  // Implement your payment instructions logic
  throw new Error('Not implemented');
}

export default router;
