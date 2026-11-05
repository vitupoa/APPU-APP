import { prisma } from '../../config/database.js';
import { WithdrawalStatus } from '@prisma/client';
import { kycService } from '../kyc/kyc.service.js';
import { transactionSigner, TransactionPayload } from '../../utils/transactionSigner.js';
import { nonceService } from '../../services/nonce.service.js';
import { WithdrawalSecurityMetadata } from './withdrawal.types.js';
import { WithdrawalSecurityValidator } from '../../utils/withdrawalSecurity.js';
import crypto from 'crypto';

const DAILY_WITHDRAWAL_LIMIT = 500000; // Rc. 500,000 per day
const HOURLY_WITHDRAWAL_LIMIT = 30000; // Rc. 30,000 per hour
const SINGLE_TRANSACTION_LIMIT = 30000; // Rc. 30,000 per transaction
const RAPID_WITHDRAWAL_THRESHOLD = 3; // 3 withdrawals in 24 hours
const NEW_ACCOUNT_DAYS = 7; // Account less than 7 days old
const LARGE_FIRST_WITHDRAWAL_THRESHOLD = 50000;

export class WithdrawalService {
  // Request withdrawal with transaction signing
  async requestWithdrawal(
    userId: string,
    request: any, // WithdrawRequestDto equivalent
    signature: string,
    timestamp: number,
    nonce: string,
    // NEW: Enhanced security parameters
    securityMetadata?: WithdrawalSecurityMetadata
  ) {
    const { 
      provider, 
      krAmount: amountKr, 
      currency, 
      phoneNumber, 
      accountNumber, 
      bankCode, 
      accountName, 
      country,
      deviceSecurityScore,
      isRooted,
      isEmulator,
      amountHash,
      requestTimestamp,
      balanceHash
    } = request;
    
    // SECURITY: Sanitize and validate the amount
    const sanitizedAmount = WithdrawalSecurityValidator.sanitizeAmount(amountKr);
    if (sanitizedAmount === null) {
      throw new Error('Invalid withdrawal amount format');
    }
    
    // SECURITY: Get current user balance for validation
    const wallet = await prisma.wallets.findUnique({
      where: { user_id: userId }
    });
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    
    const currentBalance = Number(wallet.kr_balance);
    
    // SECURITY: Validate withdrawal amount constraints
    const amountValidation = WithdrawalSecurityValidator.validateWithdrawalAmount(
      sanitizedAmount,
      currentBalance
    );
    
    if (!amountValidation.isValid) {
      throw new Error(amountValidation.message);
    }
    
    // SECURITY: Validate request integrity (hashes and timestamp)
    const integrityValidation = WithdrawalSecurityValidator.validateRequestIntegrity(
      userId,
      sanitizedAmount,
      requestTimestamp,
      amountHash,
      balanceHash,
      nonce,
      currentBalance
    );
    
    if (!integrityValidation.isValid) {
      throw new Error(`Security validation failed: ${integrityValidation.message}`);
    }
    
    // Use the sanitized amount for all further processing
    const finalAmount = sanitizedAmount;
    
    // Build account details based on provider
    let accountDetails: any = {};
    
    switch (provider) {
      case 'mpesa':
        accountDetails = { phoneNumber };
        break;
      case 'paystack':
      case 'bank':
        accountDetails = { 
          accountNumber, 
          bankCode, 
          accountName, 
          country 
        };
        break;
      default:
        throw new Error('Invalid provider');
    }
    
    // Build security metadata
    const metadata: WithdrawalSecurityMetadata = {
      hardwareSecurityUsed: false,
      biometricVerified: false,
      multiSigRequired: false,
      rateLimitChecked: true,
      deviceSecurityScore: deviceSecurityScore || 50,
      isRooted: isRooted || false,
      isEmulator: isEmulator || false,
      ...securityMetadata
    };
    // Step 1: Verify transaction signature
    const payload: TransactionPayload = {
      user_id: userId,
      amountKr: finalAmount,
      provider,
      accountName: accountName || 'N/A',
      accountDetails,
      currency,
      timestamp,
      nonce
    };

    const verification = transactionSigner.verify(payload, signature);
    if (!verification.valid) {
      throw new Error(verification.error || 'Invalid transaction signature');
    }

    // Step 2: Check nonce freshness (prevent replay attacks)
    const isNonceFresh = await nonceService.isNonceFresh(nonce, userId);
    if (!isNonceFresh) {
      throw new Error('Transaction already processed. This request has been used before.');
    }

    // Step 3: Mark nonce as used
    await nonceService.markNonceUsed(nonce, userId);

    // Step 4: Validate security metadata (if provided)
    if (metadata) {
      this.validateSecurityMetadata(metadata);
    }
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        kyc_status: true,
        created_at: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if KYC is completed
    const hasKYC = await kycService.hasCompletedKYC(userId);
    
    if (!hasKYC) {
      // Check if user has submitted KYC documents
      const kycDocuments = await prisma.kyc_documents.findMany({
        where: { user_id: userId, status: { in: ['PENDING', 'APPROVED'] } }
      });

      if (kycDocuments.length === 0) {
        throw new Error('KYC_REQUIRED: Please complete KYC verification before withdrawing. Take photos of your ID (front & back) and a selfie using your camera.');
      }

      if (kycDocuments.some(doc => doc.status === 'PENDING')) {
        throw new Error('KYC_PENDING: Your KYC documents are under review. Please wait for approval before making withdrawals.');
      }
    }

    // Check wallet balance (double-check after security validation)
    if (Number(wallet.kr_balance) < finalAmount) {
      throw new Error('Insufficient balance');
    }

    // Initialize withdrawal limit if not exists
    await kycService.initializeWithdrawalLimit(userId);

    // Check daily withdrawal limit
    const withdrawalLimit = await prisma.withdrawal_limits.findUnique({
      where: { user_id: userId }
    });

    if (!withdrawalLimit) {
      throw new Error('Withdrawal limit not initialized');
    }

    // SECURITY: Enforce minimum withdrawal amount from KYC limits
    const minWithdrawalAmount = 100; // 100 Rc minimum
    if (finalAmount < minWithdrawalAmount) {
      throw new Error(`Minimum withdrawal amount is ${minWithdrawalAmount} Rc`);
    }

    // SECURITY: Enforce maximum single transaction limit
    if (finalAmount > SINGLE_TRANSACTION_LIMIT) {
      throw new Error(`Maximum withdrawal per transaction is Rc. ${SINGLE_TRANSACTION_LIMIT.toLocaleString()}`);
    }

    // SECURITY: Check hourly withdrawal limit
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyWithdrawals = await prisma.withdrawal_requests.aggregate({
      where: {
        user_id: userId,
        created_at: { gte: oneHourAgo },
        status: { in: ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED'] }
      },
      _sum: { amount_kr: true }
    });

    const withdrawnThisHour = Number(hourlyWithdrawals._sum.amount_kr || 0);
    const newHourlyTotal = withdrawnThisHour + finalAmount;

    if (newHourlyTotal > HOURLY_WITHDRAWAL_LIMIT) {
      throw new Error(
        `Hourly withdrawal limit exceeded. Limit: Rc. ${HOURLY_WITHDRAWAL_LIMIT.toLocaleString()}, ` +
        `Already withdrawn this hour: Rc. ${withdrawnThisHour.toLocaleString()}, ` +
        `Available: Rc. ${(HOURLY_WITHDRAWAL_LIMIT - withdrawnThisHour).toLocaleString()}`
      );
    }

    // Reset if new day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastReset = new Date(withdrawalLimit.last_reset_date);
    lastReset.setHours(0, 0, 0, 0);

    if (today > lastReset) {
      await prisma.withdrawal_limits.update({
        where: { user_id: userId },
        data: {
          withdrawn_today_kr: 0,
          last_reset_date: today
        }
      });
    }

    // Check if exceeds daily limit
    const currentWithdrawn = Number(withdrawalLimit.withdrawn_today_kr);
    const dailyLimit = Number(withdrawalLimit.daily_limit_kr);
    
    // SECURITY: Enforce maximum daily limit (cannot exceed 500,000 Rc)
    const effectiveDailyLimit = Math.min(dailyLimit, DAILY_WITHDRAWAL_LIMIT);
    const newWithdrawnToday = currentWithdrawn + finalAmount;
    
    if (newWithdrawnToday > effectiveDailyLimit) {
      throw new Error(
        `Daily withdrawal limit exceeded. Limit: Rc. ${effectiveDailyLimit.toLocaleString()}, ` +
        `Already withdrawn today: Rc. ${currentWithdrawn.toLocaleString()}, ` +
        `Available: Rc. ${(effectiveDailyLimit - currentWithdrawn).toLocaleString()}`
      );
    }

    // Detect suspicious patterns
    const suspiciousFlags = await this.detectSuspiciousPatterns(userId, finalAmount);
    const riskScore = this.calculateRiskScore(suspiciousFlags, user.created_at, finalAmount, metadata);

    // Determine initial status
    let status: WithdrawalStatus = 'PENDING';

    // Flag if high risk
    if (riskScore >= 70) {
      status = 'FLAGGED';
    }

    // Get KYC document IDs
    const kycDocumentIds = (await prisma.kyc_documents.findMany({
      where: { user_id: userId, status: 'APPROVED' },
      select: { id: true }
    })).map((doc: { id: string }) => doc.id);

    // Create withdrawal request
    const withdrawalRequest = await prisma.$transaction(async (tx: any) => {
      // SECURITY: Lock wallet row to prevent race conditions
      const lockedWallet = await tx.wallets.findUnique({
        where: { user_id: userId },
        select: { kr_balance: true }
      });

      if (!lockedWallet) {
        throw new Error('Wallet not found');
      }

      const currentLockedBalance = Number(lockedWallet.kr_balance);

      // SECURITY: Re-validate balance after lock (prevent TOCTOU attacks)
      if (currentLockedBalance < finalAmount) {
        throw new Error(`Insufficient balance. Available: ${currentLockedBalance} Rc, Requested: ${finalAmount} Rc`);
      }

      // Deduct from wallet
      const updatedWallet = await tx.wallets.update({
        where: { user_id: userId },
        data: {
          kr_balance: { decrement: finalAmount }
        },
        select: { kr_balance: true }
      });

      // SECURITY: Verify balance didn't go negative (double-check)
      if (Number(updatedWallet.kr_balance) < 0) {
        throw new Error('Transaction would result in negative balance - operation aborted');
      }

      // Update withdrawal limit
      await tx.withdrawal_limits.update({
        where: { user_id: userId },
        data: {
          withdrawn_today_kr: { increment: finalAmount }
        }
      });

      // Create withdrawal request
      const request = await tx.withdrawal_requests.create({
        data: {
          user_id: userId,
          amount_kr: finalAmount,
          provider,
          account_name: accountName || 'N/A',
          account_details: accountDetails,
          currency,
          status,
          requires_kyc: true,
          kyc_document_ids: kycDocumentIds,
          suspicious_flags: suspiciousFlags,
          risk_score: riskScore,
          // Store security metadata in metadata field
          metadata: metadata ? {
            security: metadata,
            timestamp: new Date().toISOString(),
            requestTimestamp,
            amountHash,
            balanceHash,
            originalAmount: amountKr,
            sanitizedAmount: finalAmount
          } : undefined
        }
      });

      // Create transaction record
      await tx.transactions.create({
        data: {
          user_id: userId,
          type: 'withdraw',
          amount_kr: finalAmount,
          currency,
          provider,
          status: 'pending',
          reference: request.id,
          metadata: {
            withdrawalAmount: finalAmount,
            securityValidated: true,
            requestTimestamp
          }
        }
      });

      return request;
    });

    // Log suspicious activities
    if (Object.keys(suspiciousFlags).length > 0) {
      await this.logSuspiciousActivity(userId, suspiciousFlags, riskScore);
    }

    return {
      ...withdrawalRequest,
      processingTime: '24-48 hours'
    };
  }

  // Detect suspicious patterns
  private async detectSuspiciousPatterns(userId: string, finalAmount: number) {
    const flags: any = {};

    // Check rapid withdrawals (3+ in 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentWithdrawals = await prisma.withdrawal_requests.count({
      where: {
        user_id: userId,
        created_at: { gte: last24Hours }
      }
    });

    if (recentWithdrawals >= RAPID_WITHDRAWAL_THRESHOLD) {
      flags.rapidWithdrawals = {
        count: recentWithdrawals,
        threshold: RAPID_WITHDRAWAL_THRESHOLD
      };
    }

    // Check if new account
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { created_at: true }
    });

    if (user) {
      const accountAgeDays = Math.floor((Date.now() - user.created_at.getTime()) / (1000 * 60 * 60 * 24));
      if (accountAgeDays < NEW_ACCOUNT_DAYS) {
        flags.newAccount = {
          accountAgeDays,
          threshold: NEW_ACCOUNT_DAYS
        };
      }
    }

    // Check unusual amount (> 10x average)
    const avgWithdrawal = await prisma.withdrawal_requests.aggregate({
      where: {
        user_id: userId,
        status: { in: ['COMPLETED', 'PROCESSING'] }
      },
      _avg: { amount_kr: true }
    });

    if (avgWithdrawal._avg.amount_kr && finalAmount > Number(avgWithdrawal._avg.amount_kr) * 10) {
      flags.unusualAmount = {
        amount: finalAmount,
        average: avgWithdrawal._avg.amount_kr,
        multiplier: finalAmount / Number(avgWithdrawal._avg.amount_kr)
      };
    }

    // Check if first withdrawal is large (> 50000)
    const withdrawalCount = await prisma.withdrawal_requests.count({
      where: { user_id: userId }
    });

    if (withdrawalCount === 0 && finalAmount > LARGE_FIRST_WITHDRAWAL_THRESHOLD) {
      flags.largeFirstWithdrawal = {
        amount: finalAmount,
        threshold: LARGE_FIRST_WITHDRAWAL_THRESHOLD
      };
    }

    return flags;
  }

  // Validate security metadata
  private validateSecurityMetadata(metadata: WithdrawalSecurityMetadata) {
    // Check for rooted/jailbroken devices
    if (metadata.isRooted === true) {
      throw new Error('SECURITY_ERROR: Withdrawals are not allowed from rooted or jailbroken devices');
    }

    // Verify biometric timestamp is recent (within 5 minutes)
    if (metadata.biometricVerified && metadata.biometricTimestamp) {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      if (metadata.biometricTimestamp < fiveMinutesAgo) {
        throw new Error('SECURITY_ERROR: Biometric verification expired. Please authenticate again.');
      }
    }

    // Validate device security score
    if (metadata.deviceSecurityScore < 50) {
      throw new Error('SECURITY_ERROR: Device security score too low. Please secure your device.');
    }
  }

  // Calculate risk score
  private calculateRiskScore(
    flags: any, 
    accountCreatedAt: Date, 
    finalAmount: number,
    securityMetadata?: WithdrawalSecurityMetadata
  ): number {
    let score = 0;

    if (flags.rapidWithdrawals) score += 30;
    if (flags.newAccount) score += 25;
    if (flags.unusualAmount) score += 20;
    if (flags.largeFirstWithdrawal) score += 25;

    // Additional risk for very new accounts with large withdrawals
    const accountAgeDays = Math.floor((Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (accountAgeDays < 3 && finalAmount > 500) {
      score += 20;
    }

    // REDUCE risk score if enhanced security is used
    if (securityMetadata) {
      if (securityMetadata.hardwareSecurityUsed) score -= 15;
      if (securityMetadata.biometricVerified) score -= 10;
      if (securityMetadata.multiSigRequired && securityMetadata.multiSigSignatures?.length) score -= 20;
      if (securityMetadata.deviceSecurityScore >= 80) score -= 10;
    }

    return Math.max(0, Math.min(score, 100));
  }

  // Log suspicious activity
  private async logSuspiciousActivity(userId: string, flags: any, riskScore: number) {
    const severity = riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low';

    await prisma.suspicious_activities.create({
      data: {
        user_id: userId,
        activity_type: 'withdrawal_request',
        description: `Suspicious withdrawal patterns detected: ${Object.keys(flags).join(', ')}`,
        severity,
        metadata: { flags, riskScore }
      }
    });
  }

  // Get pending withdrawals for review (Super Admin / Finance Manager)
  async getPendingWithdrawals(status?: WithdrawalStatus, limit: number = 50, offset: number = 0) {
    const where = status ? { status } : { status: { in: ['PENDING' as WithdrawalStatus, 'UNDER_REVIEW' as WithdrawalStatus, 'FLAGGED' as WithdrawalStatus] } };

    const requests = await prisma.withdrawal_requests.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            email: true,
            kyc_status: true,
            created_at: true
          }
        }
      },
      orderBy: [
        { risk_score: 'desc' },
        { created_at: 'asc' }
      ],
      take: limit,
      skip: offset
    });

    // Fetch KYC documents for each request
    const requestsWithKYC = await Promise.all(
      requests.map(async (request: any) => {
        const kycDocuments = request.kyc_document_ids.length > 0 ?
          await prisma.kyc_documents.findMany({
            where: { id: { in: request.kyc_document_ids } }
          }) : [];

        return {
          ...request,
          kycDocuments
        };
      })
    );

    const total = await prisma.withdrawal_requests.count({ where });

    return { requests: requestsWithKYC, total };
  }

  // Review withdrawal (Super Admin / Finance Manager)
  async reviewWithdrawal(
    requestId: string,
    adminId: string,
    approved: boolean,
    reviewNote?: string,
    flagReason?: string
  ) {
    const request = await prisma.withdrawal_requests.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Withdrawal request not found');
    }

    const newStatus: WithdrawalStatus = approved ? 'APPROVED' : flagReason ? 'FLAGGED' : 'REJECTED';

    const updatedRequest = await prisma.$transaction(async (tx: any) => {
      // Update withdrawal request
      const updated = await tx.withdrawal_requests.update({
        where: { id: requestId },
        data: {
          status: newStatus,
          reviewed_by: adminId,
          review_note: reviewNote,
          flag_reason: flagReason,
          reviewed_at: new Date(),
          flagged_at: flagReason ? new Date() : undefined
        }
      });

      // If rejected, refund to wallet
      if (!approved && !flagReason) {
        const refundAmount = Number(request.amount_kr);
        const withdrawnAmount = Number(request.amount_kr);
        
        await tx.wallets.update({
          where: { user_id: request.user_id },
          data: {
            kr_balance: { increment: refundAmount }
          }
        });

        // Update withdrawal limit
        await tx.withdrawal_limits.update({
          where: { user_id: request.user_id },
          data: {
            withdrawn_today_kr: { decrement: withdrawnAmount }
          }
        });

        // Create refund transaction
        await tx.transactions.create({
          data: {
            user_id: request.user_id,
            type: 'withdrawal_refund',
            amount_kr: refundAmount,
            currency: 'KES',
            status: 'completed',
            reference: requestId,
            metadata: { reason: 'Withdrawal rejected', reviewNote }
          }
        });
      }

      return updated;
    });

    // Log audit
    await prisma.audit_logs.create({
      data: {
        performed_by: adminId,
        action_type: approved ? 'WITHDRAWAL_APPROVED' : 'WITHDRAWAL_REJECTED',
        target_user_id: request.user_id,
        action_details: {
          target_type: 'WITHDRAWAL_REQUEST',
          target_id: requestId,
          details: {
            user_id: request.user_id,
            amount: request.amount_kr,
            reviewNote,
            flagReason
          }
        } as any
      }
    });

    return updatedRequest;
  }

  // Get suspicious activities
  async getSuspiciousActivities(resolved: boolean = false, limit: number = 50, offset: number = 0) {
    const activities = await prisma.suspicious_activities.findMany({
      where: { resolved: resolved },
      orderBy: [
        { severity: 'desc' },
        { created_at: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    const total = await prisma.suspicious_activities.count({
      where: { resolved: resolved }
    });

    return { activities, total };
  }

  // Resolve suspicious activity
  async resolveSuspiciousActivity(activityId: string, adminId: string, resolutionNote: string) {
    return await prisma.suspicious_activities.update({
      where: { id: activityId },
      data: {
        resolved: true,
        resolved_by: adminId,
        resolved_at: new Date(),
        resolution_note: resolutionNote
      }
    });
  }
}

export const withdrawalService = new WithdrawalService();
