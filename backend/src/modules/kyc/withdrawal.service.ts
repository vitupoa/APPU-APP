import { prisma } from '../../config/database.js';
import { WithdrawalStatus } from '../../generated/prisma/client.js';
import { kycService } from '../kyc/kyc.service.js';
import { transactionSigner, TransactionPayload } from '../../utils/transactionSigner.js';
import { nonceService } from '../../services/nonce.service.js';
import { WithdrawalSecurityMetadata } from './withdrawal.types.js';
import { WithdrawalSecurityValidator } from '../../utils/withdrawalSecurity.js';

const DAILY_WITHDRAWAL_LIMIT = 500000; // Kr. 500,000 per day
const HOURLY_WITHDRAWAL_LIMIT = 30000; // Kr. 30,000 per hour
const SINGLE_TRANSACTION_LIMIT = 30000; // Kr. 30,000 per transaction
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
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    
    const currentBalance = Number(wallet.krBalance);
    
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
      userId,
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
        firstName: true,
        lastName: true,
        kycStatus: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if KYC is completed
    const hasKYC = await kycService.hasCompletedKYC(userId);
    
    if (!hasKYC) {
      // Check if user has submitted KYC documents
      const kycDocuments = await prisma.kYCDocument.findMany({
        where: { userId, status: { in: ['PENDING', 'APPROVED'] } }
      });

      if (kycDocuments.length === 0) {
        throw new Error('KYC_REQUIRED: Please complete KYC verification before withdrawing. Take photos of your ID (front & back) and a selfie using your camera.');
      }

      if (kycDocuments.some(doc => doc.status === 'PENDING')) {
        throw new Error('KYC_PENDING: Your KYC documents are under review. Please wait for approval before making withdrawals.');
      }
    }

    // Check wallet balance (double-check after security validation)
    if (Number(wallet.krBalance) < finalAmount) {
      throw new Error('Insufficient balance');
    }

    // Initialize withdrawal limit if not exists
    await kycService.initializeWithdrawalLimit(userId);

    // Check daily withdrawal limit
    const withdrawalLimit = await prisma.withdrawalLimit.findUnique({
      where: { userId }
    });

    if (!withdrawalLimit) {
      throw new Error('Withdrawal limit not initialized');
    }

    // SECURITY: Enforce minimum withdrawal amount from KYC limits
    const minWithdrawalAmount = 100; // 100 Kr minimum
    if (finalAmount < minWithdrawalAmount) {
      throw new Error(`Minimum withdrawal amount is ${minWithdrawalAmount} Kr`);
    }

    // SECURITY: Enforce maximum single transaction limit
    if (finalAmount > SINGLE_TRANSACTION_LIMIT) {
      throw new Error(`Maximum withdrawal per transaction is Kr. ${SINGLE_TRANSACTION_LIMIT.toLocaleString()}`);
    }

    // SECURITY: Check hourly withdrawal limit
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyWithdrawals = await prisma.withdrawalRequest.aggregate({
      where: {
        userId,
        createdAt: { gte: oneHourAgo },
        status: { in: ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED'] }
      },
      _sum: { amountKr: true }
    });

    const withdrawnThisHour = Number(hourlyWithdrawals._sum.amountKr || 0);
    const newHourlyTotal = withdrawnThisHour + finalAmount;

    if (newHourlyTotal > HOURLY_WITHDRAWAL_LIMIT) {
      throw new Error(
        `Hourly withdrawal limit exceeded. Limit: Kr. ${HOURLY_WITHDRAWAL_LIMIT.toLocaleString()}, ` +
        `Already withdrawn this hour: Kr. ${withdrawnThisHour.toLocaleString()}, ` +
        `Available: Kr. ${(HOURLY_WITHDRAWAL_LIMIT - withdrawnThisHour).toLocaleString()}`
      );
    }

    // Reset if new day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastReset = new Date(withdrawalLimit.lastResetDate);
    lastReset.setHours(0, 0, 0, 0);

    if (today > lastReset) {
      await prisma.withdrawalLimit.update({
        where: { userId },
        data: {
          withdrawnTodayKr: 0,
          lastResetDate: today
        }
      });
    }

    // Check if exceeds daily limit
    const currentWithdrawn = Number(withdrawalLimit.withdrawnTodayKr);
    const dailyLimit = Number(withdrawalLimit.dailyLimitKr);
    
    // SECURITY: Enforce maximum daily limit (cannot exceed 500,000 Kr)
    const effectiveDailyLimit = Math.min(dailyLimit, DAILY_WITHDRAWAL_LIMIT);
    const newWithdrawnToday = currentWithdrawn + finalAmount;
    
    if (newWithdrawnToday > effectiveDailyLimit) {
      throw new Error(
        `Daily withdrawal limit exceeded. Limit: Kr. ${effectiveDailyLimit.toLocaleString()}, ` +
        `Already withdrawn today: Kr. ${currentWithdrawn.toLocaleString()}, ` +
        `Available: Kr. ${(effectiveDailyLimit - currentWithdrawn).toLocaleString()}`
      );
    }

    // Detect suspicious patterns
    const suspiciousFlags = await this.detectSuspiciousPatterns(userId, finalAmount);
    const riskScore = this.calculateRiskScore(suspiciousFlags, user.createdAt, finalAmount, metadata);

    // Determine initial status
    let status: WithdrawalStatus = 'PENDING';

    // Flag if high risk
    if (riskScore >= 70) {
      status = 'FLAGGED';
    }

    // Get KYC document IDs
    const kycDocumentIds = (await prisma.kYCDocument.findMany({
      where: { userId, status: 'APPROVED' },
      select: { id: true }
    })).map((doc: { id: string }) => doc.id);

    // Create withdrawal request
    const withdrawalRequest = await prisma.$transaction(async (tx: any) => {
      // SECURITY: Lock wallet row to prevent race conditions
      const lockedWallet = await tx.wallet.findUnique({
        where: { userId },
        select: { krBalance: true }
      });

      if (!lockedWallet) {
        throw new Error('Wallet not found');
      }

      const currentLockedBalance = Number(lockedWallet.krBalance);

      // SECURITY: Re-validate balance after lock (prevent TOCTOU attacks)
      if (currentLockedBalance < finalAmount) {
        throw new Error(`Insufficient balance. Available: ${currentLockedBalance} Kr, Requested: ${finalAmount} Kr`);
      }

      // Deduct from wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          krBalance: { decrement: finalAmount }
        },
        select: { krBalance: true }
      });

      // SECURITY: Verify balance didn't go negative (double-check)
      if (Number(updatedWallet.krBalance) < 0) {
        throw new Error('Transaction would result in negative balance - operation aborted');
      }

      // Update withdrawal limit
      await tx.withdrawalLimit.update({
        where: { userId },
        data: {
          withdrawnTodayKr: { increment: finalAmount }
        }
      });

      // Create withdrawal request
      const request = await tx.withdrawalRequest.create({
        data: {
          userId,
          amountKr: finalAmount,
          provider,
          accountName: accountName || 'N/A',
          accountDetails,
          currency,
          status,
          requiresKyc: true,
          kycDocumentIds,
          suspiciousFlags,
          riskScore,
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
      await tx.transaction.create({
        data: {
          userId,
          type: 'withdraw',
          amountKr: finalAmount,
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
  private async detectSuspiciousPatterns(userId: string, amountKr: number) {
    const flags: any = {};

    // Check rapid withdrawals (3+ in 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentWithdrawals = await prisma.withdrawalRequest.count({
      where: {
        userId,
        createdAt: { gte: last24Hours }
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
      select: { createdAt: true }
    });

    if (user) {
      const accountAgeDays = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (accountAgeDays < NEW_ACCOUNT_DAYS) {
        flags.newAccount = {
          accountAgeDays,
          threshold: NEW_ACCOUNT_DAYS
        };
      }
    }

    // Check unusual amount (> 10x average)
    const avgWithdrawal = await prisma.withdrawalRequest.aggregate({
      where: {
        userId,
        status: { in: ['COMPLETED', 'PROCESSING'] }
      },
      _avg: { amountKr: true }
    });

    if (avgWithdrawal._avg.amountKr && amountKr > Number(avgWithdrawal._avg.amountKr) * 10) {
      flags.unusualAmount = {
        amount: amountKr,
        average: avgWithdrawal._avg.amountKr,
        multiplier: amountKr / Number(avgWithdrawal._avg.amountKr)
      };
    }

    // Check if first withdrawal is large (> 50000)
    const withdrawalCount = await prisma.withdrawalRequest.count({
      where: { userId }
    });

    if (withdrawalCount === 0 && amountKr > LARGE_FIRST_WITHDRAWAL_THRESHOLD) {
      flags.largeFirstWithdrawal = {
        amount: amountKr,
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
    amountKr: number,
    securityMetadata?: WithdrawalSecurityMetadata
  ): number {
    let score = 0;

    if (flags.rapidWithdrawals) score += 30;
    if (flags.newAccount) score += 25;
    if (flags.unusualAmount) score += 20;
    if (flags.largeFirstWithdrawal) score += 25;

    // Additional risk for very new accounts with large withdrawals
    const accountAgeDays = Math.floor((Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (accountAgeDays < 3 && amountKr > 500) {
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

    await prisma.suspiciousActivity.create({
      data: {
        userId,
        activityType: 'withdrawal_request',
        description: `Suspicious withdrawal patterns detected: ${Object.keys(flags).join(', ')}`,
        severity,
        metadata: { flags, riskScore }
      }
    });
  }

  // Get pending withdrawals for review (Super Admin / Finance Manager)
  async getPendingWithdrawals(status?: WithdrawalStatus, limit: number = 50, offset: number = 0) {
    const where = status ? { status } : { status: { in: ['PENDING' as WithdrawalStatus, 'UNDER_REVIEW' as WithdrawalStatus, 'FLAGGED' as WithdrawalStatus] } };

    const requests = await prisma.withdrawalRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            kycStatus: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { riskScore: 'desc' },
        { createdAt: 'asc' }
      ],
      take: limit,
      skip: offset
    });

    // Fetch KYC documents for each request
    const requestsWithKYC = await Promise.all(
      requests.map(async (request: any) => {
        const kycDocuments = request.kycDocumentIds.length > 0 ?
          await prisma.kYCDocument.findMany({
            where: { id: { in: request.kycDocumentIds } }
          }) : [];

        return {
          ...request,
          kycDocuments
        };
      })
    );

    const total = await prisma.withdrawalRequest.count({ where });

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
    const request = await prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!request) {
      throw new Error('Withdrawal request not found');
    }

    const newStatus: WithdrawalStatus = approved ? 'APPROVED' : flagReason ? 'FLAGGED' : 'REJECTED';

    const updatedRequest = await prisma.$transaction(async (tx: any) => {
      // Update withdrawal request
      const updated = await tx.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: newStatus,
          reviewedBy: adminId,
          reviewNote,
          flagReason,
          reviewedAt: new Date(),
          flaggedAt: flagReason ? new Date() : undefined
        }
      });

      // If rejected, refund to wallet
      if (!approved && !flagReason) {
        const refundAmount = Number(request.amountKr);
        const withdrawnAmount = Number(request.amountKr);
        
        await tx.wallet.update({
          where: { userId: request.userId },
          data: {
            krBalance: { increment: refundAmount }
          }
        });

        // Update withdrawal limit
        await tx.withdrawalLimit.update({
          where: { userId: request.userId },
          data: {
            withdrawnTodayKr: { decrement: withdrawnAmount }
          }
        });

        // Create refund transaction
        await tx.transaction.create({
          data: {
            userId: request.userId,
            type: 'withdrawal_refund',
            amountKr: refundAmount,
            currency: request.currency,
            status: 'completed',
            reference: requestId,
            metadata: { reason: 'Withdrawal rejected', reviewNote }
          }
        });
      }

      return updated;
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        adminId,
        action: approved ? 'WITHDRAWAL_APPROVED' : 'WITHDRAWAL_REJECTED',
        targetType: 'WITHDRAWAL_REQUEST',
        targetId: requestId,
        details: {
          userId: request.userId,
          amount: request.amountKr,
          reviewNote,
          flagReason
        }
      }
    });

    return updatedRequest;
  }

  // Get suspicious activities
  async getSuspiciousActivities(resolved: boolean = false, limit: number = 50, offset: number = 0) {
    const activities = await prisma.suspiciousActivity.findMany({
      where: { isResolved: resolved },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    const total = await prisma.suspiciousActivity.count({
      where: { isResolved: resolved }
    });

    return { activities, total };
  }

  // Resolve suspicious activity
  async resolveSuspiciousActivity(activityId: string, adminId: string, resolutionNote: string) {
    return await prisma.suspiciousActivity.update({
      where: { id: activityId },
      data: {
        isResolved: true,
        resolvedBy: adminId,
        resolvedAt: new Date(),
        resolutionNote
      }
    });
  }
}

export const withdrawalService = new WithdrawalService();
