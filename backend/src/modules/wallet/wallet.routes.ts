import { Router } from 'express';
import { WalletController } from './wallet.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { validateWalletOwnership } from '../../middleware/ownership.js';
import { paymentRateLimiter, withdrawalRateLimiter } from '../../middleware/ipRateLimiter.js';
import { sanitizePaymentInput } from '../../middleware/sanitization.js';
import { idempotencyMiddleware } from '../../middleware/idempotency.js';

const router = Router();

// SECURITY: All wallet routes require Authentication and Ownership Validation
router.use(authMiddleware);
router.use(validateWalletOwnership);

router.get('/balance', WalletController.getBalance);

// SECURITY: Tip endpoint with rate limiting, input sanitization, HMAC verification, and idempotency
router.post('/tip', 
  paymentRateLimiter,
  sanitizePaymentInput,
  idempotencyMiddleware({ ttlSeconds: 86400, autoGenerate: true }),
  WalletController.sendTip
);

router.get('/transactions', WalletController.getTransactions);
router.get('/exchange-rate', WalletController.getExchangeRate);
router.get('/search-users', WalletController.searchUsers);

// SECURITY: Payment endpoints with idempotency, strict rate limiting and input sanitization
router.post('/topup/initiate', 
  paymentRateLimiter,
  sanitizePaymentInput,
  idempotencyMiddleware({ ttlSeconds: 3600, autoGenerate: true }),
  WalletController.initiateTopup
);

router.post('/topup/confirm', 
  idempotencyMiddleware({ ttlSeconds: 3600, autoGenerate: true }),
  WalletController.confirmTopup
);

router.post('/verify-account', WalletController.verifyAccount);
router.get('/banks', WalletController.getBanks);
router.get('/countries', WalletController.getCountries);

export default router;
