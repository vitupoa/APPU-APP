import { prisma } from '../../config/database.js';
import { Logger } from '../../utils/logger.js';
import crypto from 'crypto';

const logger = new Logger('LockedChatTask');

export class LockedChatTaskService {
  /**
   * Check if user can message creator
   */
  async canUserMessageCreator(userId: string, creatorId: string): Promise<{
    canMessage: boolean;
    reason: 'SUBSCRIBED' | 'ACTIVE_TASK' | 'LOCKED' | 'UNLOCKED';
    unlockFeeKr?: number;
    activeTask?: any;
  }> {
    // Rule 1: Check if user is subscribed to creator
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        subscriber_id: userId,
        creator_id: creatorId,
        status: 'ACTIVE'
      }
    });

    if (subscription) {
      return {
        canMessage: true,
        reason: 'SUBSCRIBED'
      };
    }

    // Rule 2: Check if user has an active task
    const activeTask = await prisma.locked_chat_tasks.findFirst({
      where: {
        user_id: userId,
        creator_id: creatorId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        deadline: { gte: new Date() }
      },
      orderBy: { created_at: 'desc' }
    });

    if (activeTask) {
      return {
        canMessage: true,
        reason: 'ACTIVE_TASK',
        activeTask
      };
    }

    // Rule 3: Check if creator has locked chat enabled
    const chatSettings = await prisma.locked_chat_settings.findUnique({
      where: { creator_id: creatorId }
    });

    if (chatSettings && chatSettings.is_locked) {
      return {
        canMessage: false,
        reason: 'LOCKED',
        unlockFeeKr: Number(chatSettings.task_fee_kr)
      };
    }

    // Rule 4: Creator hasn't enabled locked chat
    return {
      canMessage: true,
      reason: 'UNLOCKED'
    };
  }

  /**
   * Unlock chat for a task
   */
  async unlockChatForTask(data: {
    user_id: string;
    creator_id: string;
    task_description: string;
    amount_kr: number;
    deadline_hours: number;
  }): Promise<{
    task: any;
    transaction: any;
  }> {
    // Validate creator has locked chat enabled
    const chatSettings = await prisma.locked_chat_settings.findUnique({
      where: { creator_id: data.creator_id }
    });

    if (!chatSettings || !chatSettings.is_locked) {
      throw new Error('Creator does not have locked chat enabled');
    }

    if (data.amount_kr < Number(chatSettings.task_fee_kr)) {
      throw new Error(`Minimum fee is ${chatSettings.task_fee_kr} Rc`);
    }

    // Calculate deadline
    const deadline = new Date(Date.now() + data.deadline_hours * 60 * 60 * 1000);

    // Create task and process payment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create task
      const task = await tx.locked_chat_tasks.create({
        data: {
          user_id: data.user_id,
          creator_id: data.creator_id,
          task_description: data.task_description,
          amount_kr: data.amount_kr,
          status: 'PENDING',
          deadline: deadline,
          chat_unlocked_until: deadline
        }
      });

      // Deduct from user wallet
      await tx.wallets.update({
        where: { user_id: data.user_id },
        data: { kr_balance: { decrement: data.amount_kr } }
      });

      // Add to creator wallet (minus platform fee)
      const platformFee = data.amount_kr * 0.15; // 15% platform fee
      const creatorAmount = data.amount_kr - platformFee;

      await tx.wallets.update({
        where: { user_id: data.creator_id },
        data: { kr_balance: { increment: creatorAmount } }
      });

      // Create transaction record
      const transaction = await tx.transactions.create({
        data: {
          user_id: data.user_id,
          type: 'LOCKED_CHAT_TASK',
          amount_kr: data.amount_kr,
          status: 'COMPLETED',
          counterparty_id: data.creator_id,
          context_type: 'LOCKED_CHAT_TASK',
          context_ref_id: task.id,
          context_desc: `Task: ${data.task_description.substring(0, 100)}`
        }
      });

      return { task, transaction };
    });

    logger.info(`Chat unlocked for task: ${result.task.id}`);

    return result;
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId: string, creatorId: string, deliverableUrl?: string): Promise<void> {
    const task = await prisma.locked_chat_tasks.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.creator_id !== creatorId) {
      throw new Error('Only the creator can complete this task');
    }

    if (task.status === 'COMPLETED') {
      throw new Error('Task is already completed');
    }

    await prisma.locked_chat_tasks.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
        deliverable_url: deliverableUrl,
        chat_unlocked_until: new Date() // Lock chat immediately
      }
    });

    // Update creator stats
    await prisma.locked_chat_settings.update({
      where: { creator_id: creatorId },
      data: {
        total_tasks_completed: { increment: 1 }
      }
    });

    logger.info(`Task completed: ${taskId}`);
  }

  /**
   * Get creator's locked chat settings
   */
  async getCreatorSettings(creatorId: string) {
    let settings = await prisma.locked_chat_settings.findUnique({
      where: { creator_id: creatorId }
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.locked_chat_settings.create({
        data: {
          creator_id: creatorId,
          is_locked: false,
          task_fee_kr: 100, // Default 100 Rc
          typical_delivery_time: '24 hours'
        }
      } as any);
    }

    return settings;
  }

  /**
   * Update creator's locked chat settings
   */
  async updateCreatorSettings(creatorId: string, data: {
    is_locked?: boolean;
    task_fee_kr?: number;
    typical_delivery_time?: string;
  }) {
    return await prisma.locked_chat_settings.upsert({
      where: { creator_id: creatorId },
      create: {
        creator_id: creatorId,
        is_locked: data.is_locked ?? false,
        task_fee_kr: data.task_fee_kr ?? 100,
        typical_delivery_time: data.typical_delivery_time ?? '24 hours'
      },
      update: data
    });
  }

  /**
   * Get user's active tasks
   */
  async getUserActiveTasks(userId: string) {
    return await prisma.locked_chat_tasks.findMany({
      where: {
        user_id: userId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Get creator's pending tasks
   */
  async getCreatorPendingTasks(creatorId: string) {
    return await prisma.locked_chat_tasks.findMany({
      where: {
        creator_id: creatorId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      orderBy: { created_at: 'asc' }
    });
  }

  /**
   * Expire overdue tasks (run via cron)
   */
  async expireOverdueTasks(): Promise<number> {
    const result = await prisma.locked_chat_tasks.updateMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        deadline: { lt: new Date() }
      },
      data: {
        status: 'EXPIRED',
        expired_at: new Date(),
        chat_unlocked_until: new Date() // Lock chat
      }
    });

    if (result.count > 0) {
      logger.info(`Expired ${result.count} overdue tasks`);
    }

    return result.count;
  }
}

export const lockedChatTaskService = new LockedChatTaskService();
