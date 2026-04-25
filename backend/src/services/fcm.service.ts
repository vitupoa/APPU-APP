import admin from 'firebase-admin';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class FCMService {
  private static instance: FCMService;

  private constructor() {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  async sendToDevice(deviceToken: string, payload: NotificationPayload): Promise<void> {
    try {
      const message = {
        token: deviceToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'budget_alerts',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      await admin.messaging().send(message);
      console.log(`[FCM] Notification sent to ${deviceToken}`);
    } catch (error) {
      console.error(`[FCM] Failed to send notification:`, error);
      throw error;
    }
  }

  async sendToMultipleDevices(deviceTokens: string[], payload: NotificationPayload): Promise<void> {
    try {
      const message = {
        tokens: deviceTokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'budget_alerts',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`[FCM] Sent ${response.successCount} notifications, ${response.failureCount} failed`);
    } catch (error) {
      console.error(`[FCM] Failed to send notifications:`, error);
      throw error;
    }
  }

  async sendBudgetAlert(deviceToken: string, budgetName: string, percentageSpent: number): Promise<void> {
    await this.sendToDevice(deviceToken, {
      title: '💰 Budget Alert',
      body: `You've spent ${percentageSpent}% of your ${budgetName} budget`,
      data: {
        type: 'budget_alert',
        budgetName,
        percentageSpent: percentageSpent.toString(),
      },
    });
  }

  async sendBudgetExceeded(deviceToken: string, budgetName: string): Promise<void> {
    await this.sendToDevice(deviceToken, {
      title: '⚠️ Budget Exceeded',
      body: `Your ${budgetName} budget has been exceeded`,
      data: {
        type: 'budget_exceeded',
        budgetName,
      },
    });
  }

  async sendBudgetEnding(deviceToken: string, budgetName: string, daysRemaining: number): Promise<void> {
    await this.sendToDevice(deviceToken, {
      title: '📅 Budget Ending Soon',
      body: `Your ${budgetName} budget ends in ${daysRemaining} days`,
      data: {
        type: 'budget_ending',
        budgetName,
        daysRemaining: daysRemaining.toString(),
      },
    });
  }

  async sendRecurringExpenseDue(deviceToken: string, expenseDescription: string, amount: number): Promise<void> {
    await this.sendToDevice(deviceToken, {
      title: '🔄 Recurring Expense Due',
      body: `${expenseDescription} - KES ${amount} is due`,
      data: {
        type: 'recurring_due',
        expenseDescription,
        amount: amount.toString(),
      },
    });
  }

  async sendContentFlagged(deviceToken: string, contentType: string): Promise<void> {
    await this.sendToDevice(deviceToken, {
      title: '⚠️ Content Moderated',
      body: `Your recent ${contentType} was flagged by our moderation team.`,
      data: { type: 'content_flagged', contentType },
    });
  }

  async sendWithdrawalApproved(deviceToken: string, amount: number): Promise<void> {
    await this.sendToDevice(deviceToken, {
      title: '✅ Withdrawal Approved',
      body: `Your withdrawal of KES ${amount} has been approved and processed.`,
      data: { type: 'withdrawal_approved', amount: amount.toString() },
    });
  }
}
