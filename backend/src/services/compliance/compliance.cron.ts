import cron from 'node-cron';
import { riskScoringService } from './riskScoring.service.js';
import { ofacScreeningService } from './ofacScreening.service.js';
import { lockedChatTaskService } from './lockedChatTask.service.js';
import { prisma } from '../../config/database.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('ComplianceCron');

export class ComplianceCronService {
  /**
   * Initialize all compliance cron jobs
   */
  static initialize() {
    logger.info('Initializing compliance cron jobs...');

    // Expire overdue locked chat tasks (every hour)
    this.scheduleTaskExpiration();

    // Recalculate risk scores for high-risk users (every 6 hours)
    this.scheduleRiskScoreRecalculation();

    // Update OFAC sanctions list (weekly on Sunday at 2 AM)
    this.scheduleOFACUpdate();

    // Clean up expired OFAC cache entries (daily at 3 AM)
    this.scheduleOFACCacheCleanup();

    // Generate compliance reports (daily at 4 AM)
    this.scheduleComplianceReports();

    logger.info('Compliance cron jobs initialized');
  }

  /**
   * Expire overdue locked chat tasks
   * Runs every hour
   */
  private static scheduleTaskExpiration() {
    cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Running task expiration job...');
        const expiredCount = await lockedChatTaskService.expireOverdueTasks();
        logger.info(`Expired ${expiredCount} overdue tasks`);
      } catch (error) {
        logger.error('Error in task expiration job:', error as any);
      }
    });
  }

  /**
   * Recalculate risk scores for high-risk users
   * Runs every 6 hours
   */
  private static scheduleRiskScoreRecalculation() {
    cron.schedule('0 */6 * * *', async () => {
      try {
        logger.info('Running risk score recalculation job...');

        // Get users with HIGH or CRITICAL risk levels
        const highRiskUsers = await prisma.user_risk_profiles.findMany({
          where: {
            risk_level: { in: ['HIGH', 'CRITICAL'] }
          },
          select: { user_id: true }
        });

        logger.info(`Recalculating risk scores for ${highRiskUsers.length} high-risk users`);

        let updated = 0;
        for (const profile of highRiskUsers) {
          try {
            await riskScoringService.calculateUserRiskScore(profile.user_id);
            updated++;
          } catch (error) {
            logger.error(`Error recalculating risk for user ${profile.user_id}:`, error as any);
          }
        }

        logger.info(`Risk scores recalculated for ${updated} users`);
      } catch (error) {
        logger.error('Error in risk score recalculation job:', error as any);
      }
    });
  }

  /**
   * Update OFAC sanctions list
   * Runs weekly on Sunday at 2 AM
   */
  private static scheduleOFACUpdate() {
    cron.schedule('0 2 * * 0', async () => {
      try {
        logger.info('Running OFAC list update job...');
        await ofacScreeningService.updateSDNList();
        logger.info('OFAC list updated successfully');
      } catch (error) {
        logger.error('Error in OFAC update job:', error as any);
      }
    });
  }

  /**
   * Clean up expired OFAC cache entries
   * Runs daily at 3 AM
   */
  private static scheduleOFACCacheCleanup() {
    cron.schedule('0 3 * * *', async () => {
      try {
        logger.info('Running OFAC cache cleanup job...');

        const result = await prisma.ofac_screening_cache.deleteMany({
          where: {
            expires_at: { lt: new Date() }
          }
        });

        logger.info(`Cleaned up ${result.count} expired OFAC cache entries`);
      } catch (error) {
        logger.error('Error in OFAC cache cleanup job:', error as any);
      }
    });
  }

  /**
   * Generate daily compliance reports
   * Runs daily at 4 AM
   */
  private static scheduleComplianceReports() {
    cron.schedule('0 4 * * *', async () => {
      try {
        logger.info('Generating daily compliance report...');

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count flagged transactions
        const flaggedCount = await prisma.flagged_transactions.count({
          where: {
            created_at: {
              gte: yesterday,
              lt: today
            }
          }
        });

        // Count suspicious activities
        const suspiciousCount = await prisma.suspicious_activity_logs.count({
          where: {
            created_at: {
              gte: yesterday,
              lt: today
            }
          }
        });

        // Count high-risk users
        const highRiskCount = await prisma.user_risk_profiles.count({
          where: {
            risk_level: { in: ['HIGH', 'CRITICAL'] }
          }
        });

        // Count blocked withdrawals
        const blockedWithdrawals = await prisma.user_risk_profiles.count({
          where: {
            withdrawal_blocked: true
          }
        });

        logger.info('Daily Compliance Report:', {
          date: yesterday.toISOString().split('T')[0],
          flaggedTransactions: flaggedCount,
          suspiciousActivities: suspiciousCount,
          highRiskUsers: highRiskCount,
          blockedWithdrawals
        });

        // TODO: Send report via email or store in database
      } catch (error) {
        logger.error('Error generating compliance report:', error as any);
      }
    });
  }

  /**
   * Manual trigger for all jobs (for testing)
   */
  static async runAllJobsNow() {
    logger.info('Running all compliance jobs manually...');

    try {
      await lockedChatTaskService.expireOverdueTasks();
      logger.info('✓ Task expiration completed');
    } catch (error) {
      logger.error('✗ Task expiration failed:', error as any);
    }

    try {
      await ofacScreeningService.updateSDNList();
      logger.info('✓ OFAC update completed');
    } catch (error) {
      logger.error('✗ OFAC update failed:', error as any);
    }

    logger.info('All compliance jobs completed');
  }
}

