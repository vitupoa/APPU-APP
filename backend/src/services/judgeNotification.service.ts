import { prisma } from '../config/database.js';
import { FCMService } from './fcm.service.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('JudgeNotificationService');

export class JudgeNotificationService {
  /**
   * Notify judge of invitation to judge a contest
   */
  static async notifyJudgeInvitation(judgeId: string, contestId: string, invitedBy: string) {
    try {
      const [judge, contest, inviter] = await Promise.all([
        prisma.user.findUnique({ where: { id: judgeId }, select: { fcmToken: true, username: true } }),
        prisma.contest.findUnique({ where: { id: contestId }, select: { title: true } }),
        prisma.user.findUnique({ where: { id: invitedBy }, select: { username: true } })
      ]);

      if (!judge || !contest || !inviter) return;

      // Create notification
      await prisma.notifications.create({
        data: {
          user_id: judgeId,
          type: 'JUDGE_INVITATION',
          title: 'Judge Invitation',
          message: `${inviter.username} invited you to judge "${contest.title}"`,
          data: {
            contestId,
            invitedBy,
            action: 'VIEW_INVITATION'
          }
        }
      });

      // Send FCM notification
      if (judge.fcmToken) {
        await FCMService.sendNotification(judge.fcmToken, {
          title: 'Judge Invitation',
          body: `${inviter.username} invited you to judge "${contest.title}"`,
          data: {
            type: 'JUDGE_INVITATION',
            contestId,
            invitedBy
          }
        });
      }

      logger.info(`Judge invitation notification sent to ${judgeId} for contest ${contestId}`);
    } catch (error) {
      logger.error('Failed to send judge invitation notification:', error);
    }
  }

  /**
   * Notify judge when invitation is accepted
   */
  static async notifyJudgeAccepted(judgeId: string, contestId: string) {
    try {
      const [judge, contest] = await Promise.all([
        prisma.user.findUnique({ where: { id: judgeId }, select: { fcmToken: true } }),
        prisma.contest.findUnique({ where: { id: contestId }, select: { title: true, creator_id: true } })
      ]);

      if (!judge || !contest) return;

      // Notify contest creator
      await prisma.notifications.create({
        data: {
          user_id: contest.creator_id,
          type: 'JUDGE_ACCEPTED',
          title: 'Judge Accepted',
          message: `A judge accepted your invitation for "${contest.title}"`,
          data: {
            contestId,
            judgeId,
            action: 'VIEW_CONTEST'
          }
        }
      });

      logger.info(`Judge acceptance notification sent for contest ${contestId}`);
    } catch (error) {
      logger.error('Failed to send judge acceptance notification:', error);
    }
  }

  /**
   * Notify judge when submissions are ready for judging
   */
  static async notifySubmissionsReady(contestId: string) {
    try {
      const [contest, judges] = await Promise.all([
        prisma.contest.findUnique({ where: { id: contestId }, select: { title: true } }),
        prisma.contest_judges.findMany({
          where: { contest_id: contestId, status: 'accepted' },
          include: { User: { select: { id: true, fcmToken: true, username: true } } }
        })
      ]);

      if (!contest || judges.length === 0) return;

      // Notify all judges
      for (const judge of judges) {
        await prisma.notifications.create({
          data: {
            user_id: judge.User.id,
            type: 'JUDGING_READY',
            title: 'Ready to Judge',
            message: `Submissions are ready for judging in "${contest.title}"`,
            data: {
              contestId,
              action: 'START_JUDGING'
            }
          }
        });

        if (judge.User.fcmToken) {
          await FCMService.sendNotification(judge.User.fcmToken, {
            title: 'Ready to Judge',
            body: `Submissions are ready for judging in "${contest.title}"`,
            data: {
              type: 'JUDGING_READY',
              contestId
            }
          });
        }
      }

      logger.info(`Judging ready notifications sent for contest ${contestId} to ${judges.length} judges`);
    } catch (error) {
      logger.error('Failed to send judging ready notifications:', error);
    }
  }

  /**
   * Notify judge of judging deadline approaching
   */
  static async notifyJudgingDeadline(contestId: string, hoursRemaining: number) {
    try {
      const [contest, judges] = await Promise.all([
        prisma.contest.findUnique({ where: { id: contestId }, select: { title: true } }),
        prisma.contest_judges.findMany({
          where: { contest_id: contestId, status: 'accepted' },
          include: { User: { select: { id: true, fcmToken: true } } }
        })
      ]);

      if (!contest || judges.length === 0) return;

      for (const judge of judges) {
        // Check if judge has completed scoring
        const scores = await prisma.judge_scores.count({
          where: { judge_id: judge.id }
        });

        const submissions = await prisma.contestSubmission.count({
          where: { contest_id: contestId }
        });

        if (scores < submissions) {
          await prisma.notifications.create({
            data: {
              user_id: judge.User.id,
              type: 'JUDGING_DEADLINE',
              title: 'Judging Deadline Approaching',
              message: `Only ${hoursRemaining} hours left to complete judging for "${contest.title}"`,
              data: {
                contestId,
                hoursRemaining,
                action: 'CONTINUE_JUDGING'
              }
            }
          });

          if (judge.User.fcmToken) {
            await FCMService.sendNotification(judge.User.fcmToken, {
              title: 'Judging Deadline Approaching',
              body: `Only ${hoursRemaining} hours left to complete judging for "${contest.title}"`,
              data: {
                type: 'JUDGING_DEADLINE',
                contestId,
                hoursRemaining: hoursRemaining.toString()
              }
            });
          }
        }
      }

      logger.info(`Judging deadline notifications sent for contest ${contestId}`);
    } catch (error) {
      logger.error('Failed to send judging deadline notifications:', error);
    }
  }

  /**
   * Notify judge when all judges have completed scoring
   */
  static async notifyJudgingComplete(contestId: string) {
    try {
      const [contest, judges] = await Promise.all([
        prisma.contest.findUnique({ where: { id: contestId }, select: { title: true, creator_id: true } }),
        prisma.contest_judges.findMany({
          where: { contest_id: contestId, status: 'accepted' },
          include: { User: { select: { id: true, fcmToken: true } } }
        })
      ]);

      if (!contest || judges.length === 0) return;

      // Notify all judges
      for (const judge of judges) {
        await prisma.notifications.create({
          data: {
            user_id: judge.User.id,
            type: 'JUDGING_COMPLETE',
            title: 'Judging Complete',
            message: `All judges have completed scoring for "${contest.title}"`,
            data: {
              contestId,
              action: 'VIEW_RESULTS'
            }
          }
        });

        if (judge.User.fcmToken) {
          await FCMService.sendNotification(judge.User.fcmToken, {
            title: 'Judging Complete',
            body: `All judges have completed scoring for "${contest.title}"`,
            data: {
              type: 'JUDGING_COMPLETE',
              contestId
            }
          });
        }
      }

      // Notify contest creator
      await prisma.notifications.create({
        data: {
          user_id: contest.creator_id,
          type: 'JUDGING_COMPLETE',
          title: 'Judging Complete',
          message: `Judging is complete for "${contest.title}"`,
          data: {
            contestId,
            action: 'VIEW_RESULTS'
          }
        }
      });

      logger.info(`Judging complete notifications sent for contest ${contestId}`);
    } catch (error) {
      logger.error('Failed to send judging complete notifications:', error);
    }
  }

  /**
   * Notify judge when a submission receives a comment/question
   */
  static async notifySubmissionComment(judgeId: string, contestId: string, submissionId: string, commenterId: string) {
    try {
      const [judge, contest, commenter] = await Promise.all([
        prisma.user.findUnique({ where: { id: judgeId }, select: { fcmToken: true } }),
        prisma.contest.findUnique({ where: { id: contestId }, select: { title: true } }),
        prisma.user.findUnique({ where: { id: commenterId }, select: { username: true } })
      ]);

      if (!judge || !contest || !commenter) return;

      await prisma.notifications.create({
        data: {
          user_id: judgeId,
          type: 'SUBMISSION_COMMENT',
          title: 'New Comment on Submission',
          message: `${commenter.username} commented on a submission in "${contest.title}"`,
          data: {
            contestId,
            submissionId,
            commenterId,
            action: 'VIEW_SUBMISSION'
          }
        }
      });

      if (judge.fcmToken) {
        await FCMService.sendNotification(judge.fcmToken, {
          title: 'New Comment on Submission',
          body: `${commenter.username} commented on a submission in "${contest.title}"`,
          data: {
            type: 'SUBMISSION_COMMENT',
            contestId,
            submissionId
          }
        });
      }

      logger.info(`Submission comment notification sent to judge ${judgeId}`);
    } catch (error) {
      logger.error('Failed to send submission comment notification:', error);
    }
  }

  /**
   * Get judge statistics for a contest
   */
  static async getJudgeStats(judgeId: string, contestId: string) {
    try {
      const [totalSubmissions, scoredSubmissions, avgScore] = await Promise.all([
        prisma.contestSubmission.count({ where: { contest_id: contestId } }),
        prisma.judge_scores.count({ where: { judge: { contest_id: contestId, user_id: judgeId } } }),
        prisma.judge_scores.aggregate({
          where: { judge: { contest_id: contestId, user_id: judgeId } },
          _avg: { score: true }
        })
      ]);

      return {
        totalSubmissions,
        scoredSubmissions,
        remainingSubmissions: totalSubmissions - scoredSubmissions,
        completionPercentage: totalSubmissions > 0 ? (scoredSubmissions / totalSubmissions) * 100 : 0,
        averageScore: avgScore._avg.score || 0
      };
    } catch (error) {
      logger.error('Failed to get judge stats:', error);
      return null;
    }
  }
}
