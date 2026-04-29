import { prisma } from '../../config/database.js';
import admin from 'firebase-admin';

// Initialize Firebase Admin (should be done once in app initialization)
// admin.initializeApp({
//   credential: admin.credential.cert({
//     projectId: process.env.FIREBASE_PROJECT_ID,
//     clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//     privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
//   })
// });

export class NotificationService {
  /**
   * Send judge invitation notification
   */
  static async sendJudgeInvite(judgeId: string, contestId: string, inviteId: string) {
    try {
      const [judge, contest] = await Promise.all([
        prisma.user.findUnique({ 
          where: { id: judgeId },
          select: { 
            id: true, 
            displayName: true, 
            email: true, 
            fcmToken: true 
          }
        }),
        prisma.contest.findUnique({ 
          where: { id: contestId },
          include: { 
            creator: { 
              select: { 
                id: true, 
                displayName: true, 
                username: true 
              } 
            } 
          }
        })
      ]);

      if (!judge || !contest) {
        throw new Error('Judge or contest not found');
      }

      // 1. Create in-app notification
      await prisma.$executeRaw`
        INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at)
        VALUES (
          gen_random_uuid(),
          ${judgeId},
          'JUDGE_INVITE',
          'Judge Invitation',
          ${`${contest.creator.displayName} invited you to judge "${contest.title}"`},
          ${JSON.stringify({ contestId, inviteId, creatorId: contest.creator.id })}::jsonb,
          false,
          NOW()
        )
      `;

      // 2. Send push notification if FCM token exists
      if (judge.fcmToken) {
        await this.sendPushNotification(judge.fcmToken, {
          title: 'Judge Invitation',
          body: `You've been invited to judge "${contest.title}"`,
          data: {
            type: 'JUDGE_INVITE',
            contestId,
            inviteId,
            screen: 'ContestJudgeInvite'
          }
        });
      }

      console.log(`[NotificationService] Judge invite sent to ${judge.displayName} for contest ${contest.title}`);
    } catch (error) {
      console.error('[NotificationService] Failed to send judge invite:', error);
      // Don't throw - notification failure shouldn't break the invite flow
    }
  }

  /**
   * Notify contest creator that judge accepted
   */
  static async notifyJudgeAccepted(contestId: string, judgeId: string) {
    try {
      const [contest, judge] = await Promise.all([
        prisma.contest.findUnique({
          where: { id: contestId },
          include: { creator: { select: { id: true, displayName: true, fcmToken: true } } }
        }),
        prisma.user.findUnique({
          where: { id: judgeId },
          select: { displayName: true }
        })
      ]);

      if (!contest || !judge) return;

      // Create notification
      await prisma.$executeRaw`
        INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at)
        VALUES (
          gen_random_uuid(),
          ${contest.creatorId},
          'JUDGE_ACCEPTED',
          'Judge Accepted',
          ${`${judge.displayName} accepted your invitation to judge "${contest.title}"`},
          ${JSON.stringify({ contestId, judgeId })}::jsonb,
          false,
          NOW()
        )
      `;

      // Send push notification
      if (contest.creator.fcmToken) {
        await this.sendPushNotification(contest.creator.fcmToken, {
          title: 'Judge Accepted',
          body: `${judge.displayName} will judge your contest`,
          data: { type: 'JUDGE_ACCEPTED', contestId, judgeId }
        });
      }
    } catch (error) {
      console.error('[NotificationService] Failed to notify judge accepted:', error);
    }
  }

  /**
   * Notify contest creator that judge declined
   */
  static async notifyJudgeDeclined(contestId: string, judgeId: string) {
    try {
      const [contest, judge] = await Promise.all([
        prisma.contest.findUnique({
          where: { id: contestId },
          include: { creator: { select: { id: true, displayName: true, fcmToken: true } } }
        }),
        prisma.user.findUnique({
          where: { id: judgeId },
          select: { displayName: true }
        })
      ]);

      if (!contest || !judge) return;

      // Create notification
      await prisma.$executeRaw`
        INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at)
        VALUES (
          gen_random_uuid(),
          ${contest.creatorId},
          'JUDGE_DECLINED',
          'Judge Declined',
          ${`${judge.displayName} declined your invitation to judge "${contest.title}"`},
          ${JSON.stringify({ contestId, judgeId })}::jsonb,
          false,
          NOW()
        )
      `;

      // Send push notification
      if (contest.creator.fcmToken) {
        await this.sendPushNotification(contest.creator.fcmToken, {
          title: 'Judge Declined',
          body: `${judge.displayName} declined to judge your contest`,
          data: { type: 'JUDGE_DECLINED', contestId, judgeId }
        });
      }
    } catch (error) {
      console.error('[NotificationService] Failed to notify judge declined:', error);
    }
  }

  /**
   * Send push notification via FCM
   */
  private static async sendPushNotification(
    fcmToken: string,
    payload: {
      title: string;
      body: string;
      data?: Record<string, string>;
    }
  ) {
    try {
      // Check if Firebase Admin is initialized
      if (!admin.apps.length) {
        console.warn('[NotificationService] Firebase Admin not initialized, skipping push notification');
        return;
      }

      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'krieta_notifications'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      });

      console.log(`[NotificationService] Push notification sent successfully`);
    } catch (error: any) {
      if (error.code === 'messaging/registration-token-not-registered') {
        console.warn('[NotificationService] FCM token invalid, removing from user');
        // TODO: Remove invalid FCM token from user
      } else {
        console.error('[NotificationService] Failed to send push notification:', error);
      }
    }
  }

  /**
   * Send contest winner notification
   */
  static async notifyContestWinner(userId: string, contestId: string, rank: number, prizeKr: number) {
    try {
      const [user, contest] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } }),
        prisma.contest.findUnique({ where: { id: contestId }, select: { title: true } })
      ]);

      if (!user || !contest) return;

      // Create notification
      await prisma.$executeRaw`
        INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at)
        VALUES (
          gen_random_uuid(),
          ${userId},
          'CONTEST_WINNER',
          'Congratulations! 🎉',
          ${`You won ${rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`} place in "${contest.title}" and earned Kr.${prizeKr}!`},
          ${JSON.stringify({ contestId, rank, prizeKr })}::jsonb,
          false,
          NOW()
        )
      `;

      // Send push notification
      if (user.fcmToken) {
        await this.sendPushNotification(user.fcmToken, {
          title: 'You Won! 🎉',
          body: `Congratulations! You won Kr.${prizeKr} in "${contest.title}"`,
          data: { type: 'CONTEST_WINNER', contestId, rank: rank.toString() }
        });
      }
    } catch (error) {
      console.error('[NotificationService] Failed to notify contest winner:', error);
    }
  }

  /**
   * Send new admirer notification
   */
  static async notifyNewAdmirer(admiredId: string, admirerId: string) {
    try {
      const [admired, admirer] = await Promise.all([
        prisma.user.findUnique({ where: { id: admiredId }, select: { fcmToken: true } }),
        prisma.user.findUnique({ where: { id: admirerId }, select: { displayName: true, username: true } })
      ]);

      if (!admired || !admirer) return;

      // Create notification
      await prisma.$executeRaw`
        INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at)
        VALUES (
          gen_random_uuid(),
          ${admiredId},
          'NEW_ADMIRER',
          'New Admirer',
          ${`${admirer.displayName} started admiring you`},
          ${JSON.stringify({ admirerId, username: admirer.username })}::jsonb,
          false,
          NOW()
        )
      `;

      // Send push notification
      if (admired.fcmToken) {
        await this.sendPushNotification(admired.fcmToken, {
          title: 'New Admirer',
          body: `${admirer.displayName} started admiring you`,
          data: { type: 'NEW_ADMIRER', admirerId }
        });
      }
    } catch (error) {
      console.error('[NotificationService] Failed to notify new admirer:', error);
    }
  }

  /**
   * Send tip received notification
   */
  static async notifyTipReceived(recipientId: string, senderId: string, amountKr: number, message?: string) {
    try {
      const [recipient, sender] = await Promise.all([
        prisma.user.findUnique({ where: { id: recipientId }, select: { fcmToken: true } }),
        prisma.user.findUnique({ where: { id: senderId }, select: { displayName: true } })
      ]);

      if (!recipient || !sender) return;

      // Create notification
      await prisma.$executeRaw`
        INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at)
        VALUES (
          gen_random_uuid(),
          ${recipientId},
          'TIP_RECEIVED',
          'Tip Received',
          ${`${sender.displayName} sent you Kr.${amountKr}${message ? `: "${message}"` : ''}`},
          ${JSON.stringify({ senderId, amountKr, message })}::jsonb,
          false,
          NOW()
        )
      `;

      // Send push notification
      if (recipient.fcmToken) {
        await this.sendPushNotification(recipient.fcmToken, {
          title: 'Tip Received 💰',
          body: `${sender.displayName} sent you Kr.${amountKr}`,
          data: { type: 'TIP_RECEIVED', senderId, amount: amountKr.toString() }
        });
      }
    } catch (error) {
      console.error('[NotificationService] Failed to notify tip received:', error);
    }
  }
}
