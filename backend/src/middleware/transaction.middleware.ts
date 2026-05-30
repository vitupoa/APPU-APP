import { Request, Response, NextFunction } from 'express';
import { transactionContextService } from '../services/compliance/transactionContext.service.js';
import { kycTierService } from '../services/compliance/kycTier.service.js';

export async function blockWalletTransfers(req: Request, res: Response, next: NextFunction): Promise<void> {
  const transactionType = req.body.type || req.body.transaction_type;

  if (transactionType === 'WALLET_TRANSFER' || transactionType === 'wallet_transfer') {
    res.status(403).json({
      error: 'Direct wallet transfers are not allowed',
      message: 'Please use content tipping, subscriptions, or other platform services instead',
      compliance_reason: 'Platform operates as currency provider, not money transmitter'
    });
    return;
  }

  next();
}

export async function blockChatTips(req: Request, res: Response, next: NextFunction): Promise<void> {
  const transactionType = req.body.type || req.body.transaction_type;

  if (transactionType === 'CHAT_TIP' || transactionType === 'chat_tip') {
    res.status(403).json({
      error: 'Direct chat tips are not allowed',
      message: 'Please tip content (posts, shorts, videos) or unlock chat with a task instead',
      compliance_reason: 'Tips must be linked to specific content or services'
    });
    return;
  }

  next();
}

export async function validateTransactionContext(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, context_type, context_ref_id, context_desc } = req.body;

    if (!type) {
      next();
      return;
    }

    const validation = await transactionContextService.validateContext({
      type: type,
      contextType: context_type,
      referenceId: context_ref_id,
      description: context_desc
    });

    if (!validation.valid) {
      res.status(400).json({
        error: 'Invalid transaction context',
        details: validation.errors
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(400).json({
      error: 'Transaction context validation failed',
      message: error.message
    });
  }
}

export async function enforceKYCLimits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const amountKr = req.body.amount_kr || req.body.amount;

    if (!userId || !amountKr) {
      next();
      return;
    }

    const transactionType = req.body.type || req.body.transaction_type;

    if (transactionType === 'withdrawal') {
      const check = await kycTierService.checkWithdrawalLimit(userId, amountKr);

      if (!check.allowed) {
        res.status(403).json({
          error: 'Withdrawal limit exceeded',
          reason: check.reason,
          currentTier: check.currentTier,
          limits: check.limits,
          message: 'Complete KYC verification to increase your limits'
        });
        return;
      }
    }

    next();
  } catch (error: any) {
    console.error('KYC limit enforcement error:', error);
    res.status(500).json({
      error: 'Error checking KYC limits',
      message: error.message
    });
  }
}
