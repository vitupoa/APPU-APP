import { prisma } from '../config/database.js';

/**
 * Escrow Approval System
 * Implements multi-signature approval for contest prize distributions and payouts
 */

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum ApprovalType {
  CONTEST_PAYOUT = 'CONTEST_PAYOUT',
  WITHDRAWAL = 'WITHDRAWAL',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  REFUND = 'REFUND'
}

interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  amount: number;
  recipientId: string;
  requesterId: string;
  metadata: any;
  status: ApprovalStatus;
  requiredApprovals: number;
  currentApprovals: number;
  createdAt: Date;
}

interface ApprovalDecision {
  approverId: string;
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
  timestamp: Date;
}

/**
 * Escrow Approval Manager
 * Manages multi-signature approvals for financial operations
 */
export class EscrowApprovalManager {
  private static readonly MIN_SUPER_ADMIN_APPROVALS = 2;
  private static readonly APPROVAL_TIMEOUT_HOURS = 48;

  /**
   * Create approval request for contest payout
   */
  static async createContestPayoutApproval(
    contestId: string,
    winnerId: string,
    prizeAmount: number,
    requesterId: string
  ): Promise<string> {
    // Check if contest exists and is in correct state
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: { escrows: true }
    });

    if (!contest) {
      throw new Error('Contest not found');
    }

    if (contest.status !== 'PENDING_PAYOUT') {
      throw new Error('Contest is not in pending payout state');
    }

    // Verify escrow exists and has sufficient funds
    const escrow = contest.escrows.find(e => e.status === 'held');
    if (!escrow || Number(escrow.prizeAmountKr) < prizeAmount) {
      throw new Error('Insufficient escrow funds');
    }

    // Create approval request in platform config
    const approvalId = crypto.randomUUID();
    const approvalRequest = {
      id: approvalId,
      type: ApprovalType.CONTEST_PAYOUT,
      amount: prizeAmount,
      recipientId: winnerId,
      requesterId,
      metadata: {
        contestId,
        escrowId: escrow.id,
        contestTitle: contest.title
      },
      status: ApprovalStatus.PENDING,
      requiredApprovals: this.MIN_SUPER_ADMIN_APPROVALS,
      currentApprovals: 0,
      approvals: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.APPROVAL_TIMEOUT_HOURS * 60 * 60 * 1000)
    };

    // Store in platform config
    await this.storeApprovalRequest(approvalRequest);

    return approvalId;
  }

  /**
   * Create approval request for withdrawal
   */
  static async createWithdrawalApproval(
    userId: string,
    amount: number,
    withdrawalDetails: any
  ): Promise<string> {
    // Check user wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet || Number(wallet.krBalance) < amount) {
      throw new Error('Insufficient wallet balance');
    }

    const approvalId = crypto.randomUUID();
    const approvalRequest = {
      id: approvalId,
      type: ApprovalType.WITHDRAWAL,
      amount,
      recipientId: userId,
      requesterId: userId,
      metadata: {
        withdrawalDetails,
        currentBalance: Number(wallet.krBalance)
      },
      status: ApprovalStatus.PENDING,
      requiredApprovals: amount > 10000 ? this.MIN_SUPER_ADMIN_APPROVALS : 1,
      currentApprovals: 0,
      approvals: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.APPROVAL_TIMEOUT_HOURS * 60 * 60 * 1000)
    };

    await this.storeApprovalRequest(approvalRequest);

    return approvalId;
  }

  /**
   * Submit approval decision
   */
  static async submitApproval(
    approvalId: string,
    approverId: string,
    decision: 'APPROVE' | 'REJECT',
    reason?: string
  ): Promise<{ approved: boolean; message: string }> {
    // Verify approver is super admin
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
      include: { adminProfile: true }
    });

    if (!approver?.isAdmin || approver.adminProfile?.role !== 'SUPER_ADMIN') {
      throw new Error('Only super admins can approve payouts');
    }

    // Get approval request
    const approvalRequest = await this.getApprovalRequest(approvalId);

    if (!approvalRequest) {
      throw new Error('Approval request not found');
    }

    if (approvalRequest.status !== ApprovalStatus.PENDING) {
      throw new Error('Approval request is not pending');
    }

    // Check if expired
    if (new Date() > new Date(approvalRequest.expiresAt)) {
      await this.updateApprovalStatus(approvalId, ApprovalStatus.CANCELLED);
      throw new Error('Approval request has expired');
    }

    // Check if approver already voted
    const existingApproval = approvalRequest.approvals.find(
      (a: any) => a.approverId === approverId
    );

    if (existingApproval) {
      throw new Error('You have already submitted an approval decision');
    }

    // Add approval decision
    const approvalDecision: ApprovalDecision = {
      approverId,
      decision,
      reason,
      timestamp: new Date()
    };

    approvalRequest.approvals.push(approvalDecision);

    // Handle rejection
    if (decision === 'REJECT') {
      await this.updateApprovalStatus(approvalId, ApprovalStatus.REJECTED);
      return {
        approved: false,
        message: 'Payout rejected by super admin'
      };
    }

    // Count approvals
    const approvalCount = approvalRequest.approvals.filter(
      (a: any) => a.decision === 'APPROVE'
    ).length;

    approvalRequest.currentApprovals = approvalCount;

    // Check if enough approvals
    if (approvalCount >= approvalRequest.requiredApprovals) {
      await this.updateApprovalStatus(approvalId, ApprovalStatus.APPROVED);
      await this.executeApprovedPayout(approvalRequest);

      return {
        approved: true,
        message: 'Payout approved and executed'
      };
    }

    // Update approval request
    await this.updateApprovalRequest(approvalRequest);

    return {
      approved: false,
      message: `Approval recorded. ${approvalCount}/${approvalRequest.requiredApprovals} approvals received`
    };
  }

  /**
   * Execute approved payout
   */
  private static async executeApprovedPayout(approvalRequest: any): Promise<void> {
    switch (approvalRequest.type) {
      case ApprovalType.CONTEST_PAYOUT:
        await this.executeContestPayout(approvalRequest);
        break;
      case ApprovalType.WITHDRAWAL:
        await this.executeWithdrawal(approvalRequest);
        break;
      case ApprovalType.ESCROW_RELEASE:
        await this.executeEscrowRelease(approvalRequest);
        break;
      default:
        throw new Error('Unknown approval type');
    }
  }

  /**
   * Execute contest payout
   */
  private static async executeContestPayout(approvalRequest: any): Promise<void> {
    const { contestId, escrowId } = approvalRequest.metadata;

    await prisma.$transaction(async (tx) => {
      // Release escrow
      await tx.escrow.update({
        where: { id: escrowId },
        data: { status: 'released' }
      });

      // Credit winner wallet
      await tx.wallet.update({
        where: { userId: approvalRequest.recipientId },
        data: {
          krBalance: {
            increment: approvalRequest.amount
          }
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: approvalRequest.recipientId,
          type: 'contest_prize',
          amountKr: approvalRequest.amount,
          status: 'completed',
          reference: `contest_${contestId}`,
          metadata: {
            approvalId: approvalRequest.id,
            contestId,
            escrowId
          }
        }
      });

      // Update contest status
      await tx.contest.update({
        where: { id: contestId },
        data: { status: 'COMPLETED' }
      });
    });
  }

  /**
   * Execute withdrawal
   */
  private static async executeWithdrawal(approvalRequest: any): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { userId: approvalRequest.recipientId },
        data: {
          krBalance: {
            decrement: approvalRequest.amount
          }
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: approvalRequest.recipientId,
          type: 'withdraw',
          amountKr: approvalRequest.amount,
          status: 'completed',
          metadata: {
            approvalId: approvalRequest.id,
            ...approvalRequest.metadata.withdrawalDetails
          }
        }
      });

      // Update withdrawal request status
      const withdrawalRequest = await tx.withdrawalRequest.findFirst({
        where: {
          userId: approvalRequest.recipientId,
          status: 'PENDING'
        },
        orderBy: { createdAt: 'desc' }
      });

      if (withdrawalRequest) {
        await tx.withdrawalRequest.update({
          where: { id: withdrawalRequest.id },
          data: { status: 'APPROVED' }
        });
      }
    });
  }

  /**
   * Execute escrow release
   */
  private static async executeEscrowRelease(approvalRequest: any): Promise<void> {
    const { escrowId } = approvalRequest.metadata;

    await prisma.$transaction(async (tx) => {
      await tx.escrow.update({
        where: { id: escrowId },
        data: { status: 'released' }
      });

      await tx.wallet.update({
        where: { userId: approvalRequest.recipientId },
        data: {
          krBalance: {
            increment: approvalRequest.amount
          }
        }
      });
    });
  }

  /**
   * Get pending approvals for admin
   */
  static async getPendingApprovals(adminId: string): Promise<any[]> {
    const config = await prisma.platformConfig.findUnique({
      where: { key: 'escrow_approvals' }
    });

    if (!config) return [];

    const approvals = (config.value as any).approvals || [];
    
    return approvals.filter((a: any) => 
      a.status === ApprovalStatus.PENDING &&
      !a.approvals.some((ap: any) => ap.approverId === adminId)
    );
  }

  /**
   * Get approval request details
   */
  static async getApprovalRequest(approvalId: string): Promise<any> {
    const config = await prisma.platformConfig.findUnique({
      where: { key: 'escrow_approvals' }
    });

    if (!config) return null;

    const approvals = (config.value as any).approvals || [];
    return approvals.find((a: any) => a.id === approvalId);
  }

  /**
   * Store approval request
   */
  private static async storeApprovalRequest(approvalRequest: any): Promise<void> {
    const config = await prisma.platformConfig.findUnique({
      where: { key: 'escrow_approvals' }
    });

    const approvals = config ? ((config.value as any).approvals || []) : [];
    approvals.push(approvalRequest);

    await prisma.platformConfig.upsert({
      where: { key: 'escrow_approvals' },
      create: {
        key: 'escrow_approvals',
        value: { approvals }
      },
      update: {
        value: { approvals }
      }
    });
  }

  /**
   * Update approval request
   */
  private static async updateApprovalRequest(approvalRequest: any): Promise<void> {
    const config = await prisma.platformConfig.findUnique({
      where: { key: 'escrow_approvals' }
    });

    if (!config) throw new Error('Approval config not found');

    const approvals = (config.value as any).approvals || [];
    const index = approvals.findIndex((a: any) => a.id === approvalRequest.id);

    if (index === -1) throw new Error('Approval request not found');

    approvals[index] = approvalRequest;

    await prisma.platformConfig.update({
      where: { key: 'escrow_approvals' },
      data: { value: { approvals } }
    });
  }

  /**
   * Update approval status
   */
  private static async updateApprovalStatus(
    approvalId: string,
    status: ApprovalStatus
  ): Promise<void> {
    const approvalRequest = await this.getApprovalRequest(approvalId);
    if (!approvalRequest) throw new Error('Approval request not found');

    approvalRequest.status = status;
    await this.updateApprovalRequest(approvalRequest);
  }

  /**
   * Cancel expired approvals (cron job)
   */
  static async cancelExpiredApprovals(): Promise<number> {
    const config = await prisma.platformConfig.findUnique({
      where: { key: 'escrow_approvals' }
    });

    if (!config) return 0;

    const approvals = (config.value as any).approvals || [];
    const now = new Date();
    let cancelledCount = 0;

    for (const approval of approvals) {
      if (
        approval.status === ApprovalStatus.PENDING &&
        new Date(approval.expiresAt) < now
      ) {
        approval.status = ApprovalStatus.CANCELLED;
        cancelledCount++;
      }
    }

    if (cancelledCount > 0) {
      await prisma.platformConfig.update({
        where: { key: 'escrow_approvals' },
        data: { value: { approvals } }
      });
    }

    return cancelledCount;
  }
}
