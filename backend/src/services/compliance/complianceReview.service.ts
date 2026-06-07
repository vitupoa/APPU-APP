import { prisma } from '../../config/database.js';
import crypto from 'crypto';

export interface ComplianceReviewData {
  transaction_id: string;
  user_id: string;
  review_type: string;
  notes?: string;
}

export interface ReviewDecision {
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'ESCALATE';
  notes?: string;
}

class ComplianceReviewService {
  /**
   * Create a new compliance review
   */
  async createReview(data: ComplianceReviewData, reviewerId?: string): Promise<any> {
    try {
      const review = await prisma.compliance_reviews.create({
        data: {
          transaction_id: data.transaction_id,
          user_id: data.user_id,
          reviewer_id: reviewerId,
          review_type: data.review_type,
          status: 'PENDING',
          notes: data.notes
        }
      } as any);

      return review;
    } catch (error: any) {
      console.error('Error creating compliance review:', error);
      throw new Error(`Failed to create compliance review: ${error.message}`);
    }
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId: string): Promise<any> {
    try {
      const review = await prisma.compliance_reviews.findUnique({
        where: { id: reviewId }
      });

      if (!review) {
        throw new Error('Review not found');
      }

      return review;
    } catch (error: any) {
      console.error('Error getting review:', error);
      throw new Error(`Failed to get review: ${error.message}`);
    }
  }

  /**
   * Get all reviews with filters
   */
  async getReviews(filters: {
    status?: string;
    review_type?: string;
    user_id?: string;
    reviewer_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ reviews: any[]; total: number }> {
    try {
      const where: any = {};
      if (filters.status) where.status = filters.status;
      if (filters.review_type) where.review_type = filters.review_type;
      if (filters.user_id) where.user_id = filters.user_id;
      if (filters.reviewer_id) where.reviewer_id = filters.reviewer_id;

      const [reviews, total] = await Promise.all([
        prisma.compliance_reviews.findMany({
          where,
          orderBy: { created_at: 'desc' },
          take: filters.limit || 50,
          skip: filters.offset || 0
        }),
        prisma.compliance_reviews.count({ where })
      ]);

      return { reviews, total };
    } catch (error: any) {
      console.error('Error getting reviews:', error);
      throw new Error(`Failed to get reviews: ${error.message}`);
    }
  }

  /**
   * Assign reviewer to a review
   */
  async assignReviewer(reviewId: string, reviewerId: string): Promise<any> {
    try {
      const review = await prisma.compliance_reviews.update({
        where: { id: reviewId },
        data: {
          reviewer_id: reviewerId,
          status: 'IN_REVIEW'
        }
      });

      return review;
    } catch (error: any) {
      console.error('Error assigning reviewer:', error);
      throw new Error(`Failed to assign reviewer: ${error.message}`);
    }
  }

  /**
   * Submit review decision
   */
  async submitDecision(
    reviewId: string,
    reviewerId: string,
    decisionData: ReviewDecision
  ): Promise<any> {
    try {
      const review = await prisma.compliance_reviews.findUnique({
        where: { id: reviewId }
      });

      if (!review) {
        throw new Error('Review not found');
      }

      if (review.reviewer_id !== reviewerId) {
        throw new Error('Unauthorized: You are not assigned to this review');
      }

      const updatedReview = await prisma.compliance_reviews.update({
        where: { id: reviewId },
        data: {
          decision: decisionData.decision,
          notes: decisionData.notes || review.notes,
          status: decisionData.decision === 'ESCALATE' ? 'ESCALATED' : 
                  decisionData.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          reviewed_at: new Date()
        }
      });

      return updatedReview;
    } catch (error: any) {
      console.error('Error submitting decision:', error);
      throw new Error(`Failed to submit decision: ${error.message}`);
    }
  }

  /**
   * Get pending reviews count
   */
  async getPendingCount(): Promise<number> {
    try {
      const count = await prisma.compliance_reviews.count({
        where: { status: 'PENDING' }
      });

      return count;
    } catch (error: any) {
      console.error('Error getting pending count:', error);
      throw new Error(`Failed to get pending count: ${error.message}`);
    }
  }

  /**
   * Get review statistics
   */
  async getStatistics(filters?: {
    reviewer_id?: string;
    date_from?: Date;
    date_to?: Date;
  }): Promise<any> {
    try {
      const where: any = {};
      if (filters?.reviewer_id) where.reviewer_id = filters.reviewer_id;
      if (filters?.date_from || filters?.date_to) {
        where.created_at = {};
        if (filters.date_from) where.created_at.gte = filters.date_from;
        if (filters.date_to) where.created_at.lte = filters.date_to;
      }

      const [total, byStatus, byType] = await Promise.all([
        prisma.compliance_reviews.count({ where }),
        prisma.compliance_reviews.groupBy({
          by: ['status'],
          where,
          _count: true
        }),
        prisma.compliance_reviews.groupBy({
          by: ['review_type'],
          where,
          _count: true
        })
      ]);

      return {
        total,
        byStatus,
        byType
      };
    } catch (error: any) {
      console.error('Error getting statistics:', error);
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
}

export const complianceReviewService = new ComplianceReviewService();
