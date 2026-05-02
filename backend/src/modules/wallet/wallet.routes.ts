import { Router } from 'express';
import { WalletController } from './wallet.controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();

// All wallet routes require Authentication
router.use(authMiddleware);

router.get('/balance', WalletController.getBalance);
router.post('/tip', WalletController.sendTip);
router.get('/transactions', WalletController.getTransactions);
router.get('/exchange-rate', WalletController.getExchangeRate);
router.get('/search-users', WalletController.searchUsers);
router.post('/topup/initiate', WalletController.initiateTopup);
router.post('/topup/confirm', WalletController.confirmTopup);

export default router;
