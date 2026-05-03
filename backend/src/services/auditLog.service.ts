import { prisma } from '../config/database.js';
import { Request } from 'express';

interface AuditLogData {
  action: string;
  userId?: string;
  targetType?: string;
  targetId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

export class AuditLogService {
  /**
   * Create a comprehensive audit log entry
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          adminId: data.userId || 'SYSTEM',
          action: data.action,
          targetType: data.targetType || 'UNKNOWN',
          targetId: data.targetId || '',
          details: {
            ...data.details,
            success: data.success,
            errorMessage: data.errorMessage,
            timestamp: new Date().toISOString(),
          },
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should never break the main flow
    }
  }

  /**
   * Log content unlock attempt
   */
  static async logUnlock(
    req: Request,
    data: {
      userId: string;
      contentId: string;
      contentType: string;
      amountKr: number;
      success: boolean;
      error?: string;
      fraudCheckResult?: any;
    }
  ): Promise<void> {
    await this.log({
      action: 'CONTENT_UNLOCK',
      userId: data.userId,
      targetType: data.contentType,
      targetId: data.contentId,
      details: {
        amountKr: data.amountKr,
        fraudCheckResult: data.fraudCheckResult,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: data.success,
      errorMessage: data.error,
    });
  }

  /**
   * Log subscription operation
   */
  static async logSubscription(
    req: Request,
    data: {
      subscriberId: string;
      creatorId: string;
      tierType: string;
      amountKr: number;
      operation: 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'RENEW';
      success: boolean;
      error?: string;
      fraudCheckResult?: any;
    }
  ): Promise<void> {
    await this.log({
      action: `SUBSCRIPTION_${data.operation}`,
      userId: data.subscriberId,
      targetType: 'SUBSCRIPTION',
      targetId: data.creatorId,
      details: {
        tierType: data.tierType,
        amountKr: data.amountKr,
        fraudCheckResult: data.fraudCheckResult,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: data.success,
      errorMessage: data.error,
    });
  }

  /**
   * Log wallet operation
   */
  static async logWalletOperation(
    req: Request,
    data: {
      userId: string;
      operation: 'TOPUP' | 'WITHDRAW' | 'TRANSFER';
      amountKr: number;
      balanceBefore: number;
      balanceAfter: number;
      success: boolean;
      error?: string;
    }
  ): Promise<void> {
    await this.log({
      action: `WALLET_${data.operation}`,
      userId: data.userId,
      targetType: 'WALLET',
      targetId: data.userId,
      details: {
        amountKr: data.amountKr,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: data.success,
      errorMessage: data.error,
    });
  }

  /**
   * Log price conversion request
   */
  static async logConversion(
    req: Request,
    data: {
      userId: string;
      fiatAmount: number;
      currency: string;
      krAmount: number;
      conversionType: 'FIAT_TO_KR' | 'KR_TO_FIAT';
    }
  ): Promise<void> {
    await this.log({
      action: 'CURRENCY_CONVERSION',
      userId: data.userId,
      targetType: 'CONVERSION',
      targetId: data.currency,
      details: {
        fiatAmount: data.fiatAmount,
        krAmount: data.krAmount,
        conversionType: data.conversionType,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
  }

  /**
   * Log access check
   */
  static async logAccessCheck(
    req: Request,
    data: {
      userId: string;
      contentId: string;
      contentType: string;
      hasAccess: boolean;
      accessReason?: string;
    }
  ): Promise<void> {
    await this.log({
      action: 'ACCESS_CHECK',
      userId: data.userId,
      targetType: data.contentType,
      targetId: data.contentId,
      details: {
        hasAccess: data.hasAccess,
        accessReason: data.accessReason,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
  }

  /**
   * Log fraud detection trigger
   */
  static async logFraudDetection(
    req: Request,
    data: {
      userId: string;
      operationType: string;
      riskScore: number;
      reasons: string[];
      blocked: boolean;
    }
  ): Promise<void> {
    await this.log({
      action: 'FRAUD_DETECTION',
      userId: data.userId,
      targetType: 'SECURITY',
      targetId: data.operationType,
      details: {
        riskScore: data.riskScore,
        reasons: data.reasons,
        blocked: data.blocked,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
  }

  /**
   * Log rate limit violation
   */
  static async logRateLimitViolation(
    req: Request,
    data: {
      userId?: string;
      endpoint: string;
      limit: number;
      current: number;
    }
  ): Promise<void> {
    await this.log({
      action: 'RATE_LIMIT_VIOLATION',
      userId: data.userId,
      targetType: 'RATE_LIMIT',
      targetId: data.endpoint,
      details: {
        limit: data.limit,
        current: data.current,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: false,
      errorMessage: 'Rate limit exceeded',
    });
  }

  /**
   * Log authentication attempt
   */
  static async logAuthAttempt(
    req: Request,
    data: {
      userId?: string;
      email?: string;
      success: boolean;
      method: 'PASSWORD' | 'GOOGLE' | 'APPLE' | 'REFRESH_TOKEN';
      error?: string;
    }
  ): Promise<void> {
    await this.log({
      action: 'AUTH_ATTEMPT',
      userId: data.userId,
      targetType: 'AUTH',
      targetId: data.email || data.userId || 'UNKNOWN',
      details: {
        method: data.method,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: data.success,
      errorMessage: data.error,
    });
  }

  /**
   * Log admin action
   */
  static async logAdminAction(
    req: Request,
    data: {
      adminId: string;
      action: string;
      targetType: string;
      targetId: string;
      details?: any;
    }
  ): Promise<void> {
    await this.log({
      action: `ADMIN_${data.action}`,
      userId: data.adminId,
      targetType: data.targetType,
      targetId: data.targetId,
      details: data.details,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
  }

  /**
   * Log content moderation action
   */
  static async logContentModeration(
    req: Request,
    data: {
      adminId: string;
      contentType: string;
      contentId: string;
      action: 'HIDE' | 'DELETE' | 'APPROVE' | 'FLAG' | 'RESTORE';
      reason?: string;
    }
  ): Promise<void> {
    await prisma.contentModerationLog.create({
      data: {
        adminId: data.adminId,
        contentType: data.contentType,
        contentId: data.contentId,
        action: data.action,
        reason: data.reason,
      },
    });

    await this.log({
      action: 'CONTENT_MODERATION',
      userId: data.adminId,
      targetType: data.contentType,
      targetId: data.contentId,
      details: {
        action: data.action,
        reason: data.reason,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
  }

  /**
   * Log security event
   */
  static async logSecurityEvent(
    req: Request,
    data: {
      userId?: string;
      eventType: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      description: string;
      details?: any;
    }
  ): Promise<void> {
    await this.log({
      action: 'SECURITY_EVENT',
      userId: data.userId,
      targetType: 'SECURITY',
      targetId: data.eventType,
      details: {
        severity: data.severity,
        description: data.description,
        ...data.details,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });

    // If critical, also alert
    if (data.severity === 'CRITICAL') {
      console.error(
        `[CRITICAL SECURITY EVENT] ${data.eventType}: ${data.description}`,
        data.details
      );
    }
  }

  /**
   * Query audit logs with filters
   */
  static async queryLogs(filters: {
    userId?: string;
    action?: string;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.adminId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.targetType) where.targetType = filters.targetType;
    if (filters.success !== undefined)
      where.details = { path: ['success'], equals: filters.success };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Get audit log statistics
   */
  static async getStatistics(filters: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters.userId) where.adminId = filters.userId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [totalLogs, actionCounts, successRate] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['details'],
        where,
        _count: true,
      }),
    ]);

    return {
      totalLogs,
      actionCounts,
      successRate,
    };
  }
}
