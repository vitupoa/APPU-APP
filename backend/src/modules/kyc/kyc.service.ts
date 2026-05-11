import { prisma } from '../../config/database.js';
import { KYCStatus, DocumentType } from '@prisma/client';

const DAILY_WITHDRAWAL_LIMIT = 500000;
const LARGE_FIRST_WITHDRAWAL_THRESHOLD = 50000;

export class KYCService {
  // Submit KYC documents
  async submitKYC(
    userId: string,
    documentType: DocumentType,
    frontImageUrl: string,
    backImageUrl: string | null,
    selfieUrl: string
  ) {
    // Check if user already has approved KYC
    const existingKYC = await prisma.kYCDocument.findFirst({
      where: { userId, status: 'APPROVED' }
    });

    if (existingKYC) {
      throw new Error('User already has approved KYC');
    }

    // Create KYC document
    const kycDocument = await prisma.kYCDocument.create({
      data: {
        userId,
        documentType,
        frontImageUrl,
        backImageUrl,
        selfieUrl,
        status: 'PENDING'
      }
    });

    // Update user KYC status
    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: 'PENDING' }
    });

    return kycDocument;
  }

  // Get user KYC status
  async getKYCStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycStatus: true
      }
    });

    const kycDocuments = await prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const withdrawalLimit = await prisma.withdrawalLimit.findUnique({
      where: { userId }
    });

    // SECURITY: Don't expose daily limit to prevent users from gaming the system
    return {
      kycStatus: user?.kycStatus || 'NOT_STARTED',
      documents: kycDocuments,
      withdrawnToday: withdrawalLimit?.withdrawnTodayKr || 0
    };
  }

  // Verify KYC document (Super Admin / Finance Manager)
  async verifyKYC(
    documentId: string,
    adminId: string,
    approved: boolean,
    verificationNote?: string,
    rejectionReason?: string,
    nameMatches?: boolean,
    nameMatchScore?: number
  ) {
    const document = await prisma.kYCDocument.findUnique({
      where: { id: documentId },
      include: { user: true }
    });

    if (!document) {
      throw new Error('KYC document not found');
    }

    const status: KYCStatus = approved ? 'APPROVED' : 'REJECTED';

    // Update KYC document
    const updatedDocument = await prisma.kYCDocument.update({
      where: { id: documentId },
      data: {
        status,
        verifiedBy: adminId,
        verificationNote,
        rejectionReason,
        nameMatches: nameMatches ?? false,
        nameMatchScore: nameMatchScore ? nameMatchScore : undefined,
        verifiedAt: new Date()
      }
    });

    // If approved, upgrade user to APPROVED status
    if (approved) {
      await prisma.user.update({
        where: { id: document.userId },
        data: {
          kycStatus: 'APPROVED'
        }
      });

      // Update withdrawal limit
      await prisma.withdrawalLimit.upsert({
        where: { userId: document.userId },
        create: {
          userId: document.userId,
          dailyLimitKr: DAILY_WITHDRAWAL_LIMIT,
          withdrawnTodayKr: 0,
          lastResetDate: new Date()
        },
        update: {
          dailyLimitKr: DAILY_WITHDRAWAL_LIMIT
        }
      });
    } else {
      await prisma.user.update({
        where: { id: document.userId },
        data: { kycStatus: 'REJECTED' }
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        adminId,
        action: approved ? 'KYC_APPROVED' : 'KYC_REJECTED',
        targetType: 'KYC_DOCUMENT',
        targetId: documentId,
        details: {
          userId: document.userId,
          documentType: document.documentType,
          verificationNote,
          rejectionReason,
          nameMatches,
          nameMatchScore
        }
      }
    });

    return updatedDocument;
  }

  // Get pending KYC documents for review
  async getPendingKYC(limit: number = 50, offset: number = 0) {
    const documents = await prisma.kYCDocument.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.kYCDocument.count({
      where: { status: 'PENDING' }
    });

    return { documents, total };
  }

  // Check if user has completed KYC
  async hasCompletedKYC(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true }
    });

    return user?.kycStatus === 'APPROVED';
  }

  // Initialize withdrawal limit for new user
  async initializeWithdrawalLimit(userId: string) {
    const existing = await prisma.withdrawalLimit.findUnique({
      where: { userId }
    });

    if (existing) return existing;

    return await prisma.withdrawalLimit.create({
      data: {
        userId,
        dailyLimitKr: DAILY_WITHDRAWAL_LIMIT,
        withdrawnTodayKr: 0,
        lastResetDate: new Date()
      }
    });
  }

  // Reset daily withdrawal limits (run daily via cron)
  async resetDailyLimits() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.withdrawalLimit.updateMany({
      where: {
        lastResetDate: {
          lt: today
        }
      },
      data: {
        withdrawnTodayKr: 0,
        lastResetDate: today
      }
    });
  }
}

export const kycService = new KYCService();
