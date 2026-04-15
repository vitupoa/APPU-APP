import { Router } from 'express';
import { WalletController } from './wallet.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// All wallet routes require Authentication
router.use(authMiddleware);

router.get('/balance', WalletController.getBalance);
router.post('/tip', WalletController.sendTip);
router.get('/transactions', WalletController.getTransactions);
router.get('/exchange-rate', WalletController.getExchangeRate);
router.get('/search-users', WalletController.searchUsers);

// TODO: Add top-up and withdraw logic based on payment SDK endpoints later

export default router;
