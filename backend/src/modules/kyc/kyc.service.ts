import { prisma } from '../../config/database.js';
import { KYCStatus, DocumentType } from '@prisma/client';
import crypto from 'crypto';

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
    const existingKYC = await prisma.kyc_documents.findFirst({
      where: { user_id: userId, status: 'APPROVED' }
    });

    if (existingKYC) {
      throw new Error('User already has approved KYC');
    }

    // Create KYC document
    const kycDocument = await prisma.kyc_documents.create({
      data: {
        user_id: userId,
        document_type: documentType,
        front_image_url: frontImageUrl,
        back_image_url: backImageUrl,
        selfie_url: selfieUrl,
        status: 'PENDING'
      }
    } as any);

    // Update user KYC status
    await prisma.user.update({
      where: { id: userId },
      data: { kyc_status: 'PENDING' }
    });

    return kycDocument;
  }

  // Get user KYC status
  async getKYCStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        kyc_status: true
      }
    });

    const kycDocuments = await prisma.kyc_documents.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    const withdrawalLimit = await prisma.withdrawal_limits.findUnique({
      where: { user_id: userId }
    });

    // SECURITY: Don't expose daily limit to prevent users from gaming the system
    return {
      kycStatus: user?.kyc_status || 'NOT_STARTED',
      documents: kycDocuments,
      withdrawnToday: withdrawalLimit?.withdrawn_today_kr || 0
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
    const document = await prisma.kyc_documents.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      throw new Error('KYC document not found');
    }

    const status: KYCStatus = approved ? 'APPROVED' : 'REJECTED';

    // Update KYC document
    const updatedDocument = await prisma.kyc_documents.update({
      where: { id: documentId },
      data: {
        status,
        verified_by: adminId,
        verification_note: verificationNote,
        rejection_reason: rejectionReason,
        name_matches: nameMatches ?? false,
        name_match_score: nameMatchScore ? nameMatchScore : undefined,
        verified_at: new Date()
      }
    });

    // If approved, upgrade user to APPROVED status
    if (approved) {
      await prisma.user.update({
        where: { id: document.user_id },
        data: {
          kyc_status: 'APPROVED'
        }
      });

      // Update withdrawal limit
      await prisma.withdrawal_limits.upsert({
        where: { user_id: document.user_id },
        create: {
          user_id: document.user_id,
          daily_limit_kr: DAILY_WITHDRAWAL_LIMIT,
          withdrawn_today_kr: 0,
          last_reset_date: new Date()
        },
        update: {
          daily_limit_kr: DAILY_WITHDRAWAL_LIMIT
        }
      });
    } else {
      await prisma.user.update({
        where: { id: document.user_id },
        data: { kyc_status: 'REJECTED' }
      });
    }

    // Log audit
    await prisma.audit_logs.create({
      data: {
        performed_by: adminId,
        action_type: approved ? 'KYC_APPROVED' : 'KYC_REJECTED',
        target_user_id: document.user_id,
        action_details: {
          target_type: 'KYC_DOCUMENT',
          target_id: documentId,
          details: {
            user_id: document.user_id,
            documentType: document.document_type,
            verificationNote,
            rejectionReason,
            nameMatches,
            nameMatchScore
          }
        } as any
      }
    });

    return updatedDocument;
  }

  // Get pending KYC documents for review
  async getPendingKYC(limit: number = 50, offset: number = 0) {
    const documents = await prisma.kyc_documents.findMany({
      where: { status: 'PENDING' },
      orderBy: { created_at: 'asc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.kyc_documents.count({
      where: { status: 'PENDING' }
    });

    return { documents, total };
  }

  // Check if user has completed KYC
  async hasCompletedKYC(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kyc_status: true }
    });

    return user?.kyc_status === 'APPROVED';
  }

  // Initialize withdrawal limit for new user
  async initializeWithdrawalLimit(userId: string) {
    const existing = await prisma.withdrawal_limits.findUnique({
      where: { user_id: userId }
    });

    if (existing) return existing;

    return await prisma.withdrawal_limits.create({
      data: {
        user_id: userId,
        daily_limit_kr: DAILY_WITHDRAWAL_LIMIT,
        withdrawn_today_kr: 0,
        last_reset_date: new Date()
      }
    } as any);
  }

  // Reset daily withdrawal limits (run daily via cron)
  async resetDailyLimits() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.withdrawal_limits.updateMany({
      where: {
        last_reset_date: {
          lt: today
        }
      },
      data: {
        withdrawn_today_kr: 0,
        last_reset_date: today
      }
    });
  }
}

export const kycService = new KYCService();
