import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { prisma } from '../config/database.js';

/**
 * Ownership Validation Middleware
 * 
 * Ensures users can only access/modify their own resources.
 * Prevents authorization bypass attacks.
 * 
 * CRITICAL: This prevents users from manipulating other users' data
 * even if they obtain or guess resource IDs.
 */

/**
 * Validate user owns the profile being accessed
 * Use on routes like: PUT /users/:userId
 */
export async function validateProfileOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const targetUserId = (req.params.user_id || req.body.user_id) as string;
  const currentUserId = req.userId;

  if (!currentUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Allow if accessing own profile
  if (targetUserId === currentUserId) {
    next();
    return;
  }

  // Allow if admin
  if (req.isAdmin) {
    next();
    return;
  }

  res.status(403).json({ 
    error: 'Forbidden: You can only access your own profile',
    code: 'OWNERSHIP_VIOLATION'
  });
}

/**
 * Validate user owns the wallet being accessed
 * Use on routes like: GET /wallet/balance, POST /wallet/tip
 */
export async function validateWalletOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const currentUserId = req.userId;

  if (!currentUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // For wallet operations, always use authenticated user's ID
  // Never trust userId from request body/params
  req.body.user_id = currentUserId;
  req.params.user_id = currentUserId;

  next();
}

/**
 * Validate user owns the transaction being accessed
 * Use on routes like: GET /transactions/:transactionId
 */
export async function validateTransactionOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const transactionId = req.params.transaction_id as string;
  const currentUserId = req.userId;

  if (!currentUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const transaction = await prisma.transactions.findUnique({
      where: { id: transactionId },
      select: { user_id: true }
    });

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    // Allow if owns transaction
    if (transaction.user_id === currentUserId) {
      next();
      return;
    }

    // Allow if admin
    if (req.isAdmin) {
      next();
      return;
    }

    res.status(403).json({ 
      error: 'Forbidden: You can only access your own transactions',
      code: 'OWNERSHIP_VIOLATION'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate ownership' });
  }
}

/**
 * Validate user owns the withdrawal request being accessed
 * Use on routes like: GET /kyc/withdrawal/:requestId
 */
export async function validateWithdrawalOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const requestId = req.params.requestId as string;
  const currentUserId = req.userId;

  if (!currentUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const withdrawal = await prisma.withdrawal_requests.findUnique({
      where: { id: requestId },
      select: { user_id: true }
    });

    if (!withdrawal) {
      res.status(404).json({ error: 'Withdrawal request not found' });
      return;
    }

    // Allow if owns withdrawal
    if (withdrawal.user_id === currentUserId) {
      next();
      return;
    }

    // Allow if admin
    if (req.isAdmin) {
      next();
      return;
    }

    res.status(403).json({ 
      error: 'Forbidden: You can only access your own withdrawal requests',
      code: 'OWNERSHIP_VIOLATION'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate ownership' });
  }
}

/**
 * Validate user is member of chama being accessed
 * Use on routes like: GET /chama/:chamaId/members
 */
export async function validateChamaMembership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const chamaId = req.params.chama_id as string;
  const currentUserId = req.userId;

  if (!currentUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const membership = await prisma.chamaMember.findUnique({
      where: {
        chama_id_user_id: {
          chama_id: chamaId,
          user_id: currentUserId
        }
      }
    });

    if (!membership) {
      res.status(403).json({ 
        error: 'Forbidden: You are not a member of this chama',
        code: 'NOT_MEMBER'
      });
      return;
    }

    // Store membership info for later use
    req.body.chamaMembership = membership;

    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate membership' });
  }
}

/**
 * Validate user owns the content being accessed
 * Use on routes like: PUT /shorts/:shortId, DELETE /posts/:postId
 */
export async function validateContentOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const contentId = (req.params.shortId || req.params.post_id || req.params.content_id) as string;
  const contentType = req.params.shortId ? 'short' : 'post';
  const currentUserId = req.userId;

  if (!currentUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    let content;
    if (contentType === 'short') {
      content = await prisma.shorts.findUnique({
        where: { id: contentId },
        select: { user_id: true }
      });
    } else {
      content = await prisma.post.findUnique({
        where: { id: contentId },
        select: { user_id: true }
      });
    }

    if (!content) {
      res.status(404).json({ error: 'Content not found' });
      return;
    }

    // Allow if owns content
    if (content.user_id === currentUserId) {
      next();
      return;
    }

    // Allow if admin
    if (req.isAdmin) {
      next();
      return;
    }

    res.status(403).json({ 
      error: 'Forbidden: You can only modify your own content',
      code: 'OWNERSHIP_VIOLATION'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate ownership' });
  }
}

/**
 * Validate user owns the influencer profile
 */
export async function verifyInfluencerOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const influencerId = (req.body.influencerId || req.params.influencerId) as string;
  const currentUserId = req.userId;

  if (!currentUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const influencer = await prisma.influencer_profiles.findUnique({
      where: { id: influencerId },
      select: { user_id: true }
    });

    if (!influencer) {
      res.status(404).json({ error: 'Influencer profile not found' });
      return;
    }

    if (influencer.user_id === currentUserId || req.isAdmin) {
      next();
      return;
    }

    res.status(403).json({ 
      error: 'Forbidden: You can only modify your own influencer profile',
      code: 'OWNERSHIP_VIOLATION'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate ownership' });
  }
}

/**
 * Validate user owns the social media account
 */
export async function verifySocialAccountOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const accountId = req.params.account_id as string;
  const currentUserId = req.userId;

  if (!currentUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const account = await prisma.social_media_accounts.findUnique({
      where: { id: accountId },
      include: { influencer_profiles: { select: { user_id: true } } }
    });

    if (!account) {
      res.status(404).json({ error: 'Social media account not found' });
      return;
    }

    if (account.influencer_profiles.user_id === currentUserId || req.isAdmin) {
      next();
      return;
    }

    res.status(403).json({ 
      error: 'Forbidden: You can only modify your own social media accounts',
      code: 'OWNERSHIP_VIOLATION'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate ownership' });
  }
}

/**
 * Prevent users from modifying sensitive fields
 * Use on profile update routes
 */
export function preventSensitiveFieldModification(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const sensitiveFields = [
    'id',
    'email',
    'isAdmin',
    'isVerified',
    'kycStatus',
    'isWalletUnlocked',
    'walletPinHash',
    'passwordHash',
    'createdAt',
    'updatedAt'
  ];

  // Check if any sensitive fields are in the request body
  const attemptedFields = Object.keys(req.body);
  const violatedFields = attemptedFields.filter(field => 
    sensitiveFields.includes(field)
  );

  if (violatedFields.length > 0) {
    res.status(403).json({ 
      error: `Forbidden: Cannot modify sensitive fields: ${violatedFields.join(', ')}`,
      code: 'SENSITIVE_FIELD_MODIFICATION'
    });
    return;
  }

  next();
}

/**
 * Validate amount hasn't been tampered with
 * Use on payment routes
 */
export function validateAmountIntegrity(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const { amount, amountHash } = req.body;

  if (!amount || !amountHash) {
    res.status(400).json({ 
      error: 'Missing amount or amountHash',
      code: 'MISSING_SECURITY_FIELDS'
    });
    return;
  }

  // Verify amount hash
  const crypto = require('crypto');
  const expectedHash = crypto
    .createHmac('sha256', process.env.REQUEST_SIGNING_KEY || '')
    .update(amount.toString())
    .digest('hex');

  if (expectedHash !== amountHash) {
    res.status(403).json({ 
      error: 'Amount integrity check failed',
      code: 'AMOUNT_TAMPERING_DETECTED'
    });
    return;
  }

  next();
}
