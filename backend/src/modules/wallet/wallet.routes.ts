import { Router } from 'express';
import { WalletController } from './wallet.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { validateWalletOwnership } from '../../middleware/ownership.js';
import { paymentRateLimiter, withdrawalRateLimiter } from '../../middleware/ipRateLimiter.js';
import { sanitizePaymentInput } from '../../middleware/sanitization.js';

const router = Router();

// SECURITY: All wallet routes require Authentication and Ownership Validation
router.use(authMiddleware);
router.use(validateWalletOwnership);

router.get('/balance', WalletController.getBalance);
router.post('/tip', WalletController.sendTip);
router.get('/transactions', WalletController.getTransactions);
router.get('/exchange-rate', WalletController.getExchangeRate);
router.get('/search-users', WalletController.searchUsers);

// SECURITY: Payment endpoints with strict rate limiting and input sanitization
router.post('/topup/initiate', 
  paymentRateLimiter,
  sanitizePaymentInput,
  WalletController.initiateTopup
);
router.post('/topup/confirm', WalletController.confirmTopup);

// SECURITY: Withdrawal with strict rate limiting
router.post('/withdraw', 
  withdrawalRateLimiter,
  WalletController.withdraw
);

router.post('/verify-account', WalletController.verifyAccount);
router.get('/banks', WalletController.getBanks);
router.get('/countries', WalletController.getCountries);

export default router;
