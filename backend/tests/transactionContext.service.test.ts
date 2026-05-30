/**
 * Transaction Context Service Tests
 * 
 * Unit tests for TransactionContext service
 * 
 * Task: 2.1 Create TransactionContext service
 * Requirements: 2.2.1
 */

import { transactionContextService } from '../src/services/compliance/transactionContext.service.js';
import { TransactionType, TransactionContext } from '../src/types/transaction.types.js';
import { prisma } from '../src/config/database.js';

// Mock prisma
jest.mock('../src/config/database.js', () => ({
  prisma: {
    post: {
      findUnique: jest.fn(),
    },
    shorts: {
      findUnique: jest.fn(),
    },
    chat_task_unlocks: {
      findUnique: jest.fn(),
    },
    subscription_tier: {
      findUnique: jest.fn(),
    },
    contest: {
      findUnique: jest.fn(),
    },
    chama: {
      findUnique: jest.fn(),
    },
    products: {
      findUnique: jest.fn(),
    },
  },
}));

describe('TransactionContextService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateContext', () => {
    it('should validate a valid CONTENT_TIP context', async () => {
      const mockPost = { id: 'post-123', user: { display_name: 'John Doe' } };
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

      const context: Partial<TransactionContext> = {
        type: TransactionType.CONTENT_TIP,
        reference_id: 'post-123',
        description: 'Tip to John Doe on post',
        content_type: 'post',
      };

      const result = await transactionContextService.validateContext(context);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject context without type', async () => {
      const context: Partial<TransactionContext> = {
        reference_id: 'post-123',
        description: 'Tip to creator',
      };

      const result = await transactionContextService.validateContext(context);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Transaction type is required');
    });

    it('should reject context without description', async () => {
      const context: Partial<TransactionContext> = {
        type: TransactionType.CONTENT_TIP,
        reference_id: 'post-123',
      };

      const result = await transactionContextService.validateContext(context);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Transaction description is required');
    });

    it('should reject context without reference_id for types that require it', async () => {
      const context: Partial<TransactionContext> = {
        type: TransactionType.CONTENT_TIP,
        description: 'Tip to creator',
      };

      const result = await transactionContextService.validateContext(context);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Reference ID is required for Content Tip');
    });

    it('should reject blocked transaction types', async () => {
      const context: Partial<TransactionContext> = {
        type: 'WALLET_TRANSFER' as any,
        reference_id: 'wallet-123',
        description: 'Transfer to friend',
      };

      const result = await transactionContextService.validateContext(context);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('blocked'))).toBe(true);
    });

    it('should warn about short descriptions', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: 'post-123' } as any);

      const context: Partial<TransactionContext> = {
        type: TransactionType.CONTENT_TIP,
        reference_id: 'post-123',
        description: 'Tip',
      };

      const result = await transactionContextService.validateContext(context);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('too short'))).toBe(true);
    });

    it('should reject non-existent content reference', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.shorts.findUnique as jest.Mock).mockResolvedValue(null);

      const context: Partial<TransactionContext> = {
        type: TransactionType.CONTENT_TIP,
        reference_id: 'non-existent-123',
        description: 'Tip to creator on content',
      };

      const result = await transactionContextService.validateContext(context);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('does not exist'))).toBe(true);
    });

    it('should validate WITHDRAWAL without reference_id', async () => {
      const context: Partial<TransactionContext> = {
        type: TransactionType.WITHDRAWAL,
        reference_id: '',
        description: 'Withdrawal to bank account',
      };

      const result = await transactionContextService.validateContext(context);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate CONTEST_ENTRY with valid contest', async () => {
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue({ id: 'contest-123' } as any);

      const context: Partial<TransactionContext> = {
        type: TransactionType.CONTEST_ENTRY,
        reference_id: 'contest-123',
        description: 'Entry fee for contest',
      };

      const result = await transactionContextService.validateContext(context);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate CHAMA_CONTRIBUTION with valid chama', async () => {
      (prisma.chama.findUnique as jest.Mock).mockResolvedValue({ id: 'chama-123' } as any);

      const context: Partial<TransactionContext> = {
        type: TransactionType.CHAMA_CONTRIBUTION,
        reference_id: 'chama-123',
        description: 'Contribution to savings group',
      };

      const result = await transactionContextService.validateContext(context);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getContextForType', () => {
    it('should generate context for CONTENT_TIP', async () => {
      const mockPost = {
        id: 'post-123',
        user: { display_name: 'Jane Smith' },
      };
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost as any);

      const context = await transactionContextService.getContextForType(
        TransactionType.CONTENT_TIP,
        'post-123',
        { amount: 100 }
      );

      expect(context.type).toBe(TransactionType.CONTENT_TIP);
      expect(context.reference_id).toBe('post-123');
      expect(context.description).toContain('Jane Smith');
      expect(context.content_type).toBe('post');
    });

    it('should generate context for LOCKED_CHAT_TASK', async () => {
      const mockTask = {
        id: 'task-123',
        task_description: 'Record birthday message',
        creator: { display_name: 'John Doe' },
      };
      (prisma.chat_task_unlocks.findUnique as jest.Mock).mockResolvedValue(mockTask as any);

      const context = await transactionContextService.getContextForType(
        TransactionType.LOCKED_CHAT_TASK,
        'task-123'
      );

      expect(context.type).toBe(TransactionType.LOCKED_CHAT_TASK);
      expect(context.reference_id).toBe('task-123');
      expect(context.description).toContain('John Doe');
      expect(context.description).toContain('Record birthday message');
      expect(context.content_type).toBe('chat_task');
    });

    it('should generate context for SUBSCRIPTION', async () => {
      const mockSubscription = {
        id: 'sub-123',
        tier: 'PREMIUM',
        user: { display_name: 'Creator Name' },
      };
      (prisma.subscription_tier.findUnique as jest.Mock).mockResolvedValue(mockSubscription as any);

      const context = await transactionContextService.getContextForType(
        TransactionType.SUBSCRIPTION,
        'sub-123'
      );

      expect(context.type).toBe(TransactionType.SUBSCRIPTION);
      expect(context.reference_id).toBe('sub-123');
      expect(context.description).toContain('PREMIUM');
      expect(context.description).toContain('Creator Name');
      expect(context.content_type).toBe('subscription');
    });

    it('should generate context for CONTEST_ENTRY', async () => {
      const mockContest = {
        id: 'contest-123',
        title: 'Summer Photo Contest',
      };
      (prisma.contest.findUnique as jest.Mock).mockResolvedValue(mockContest as any);

      const context = await transactionContextService.getContextForType(
        TransactionType.CONTEST_ENTRY,
        'contest-123'
      );

      expect(context.type).toBe(TransactionType.CONTEST_ENTRY);
      expect(context.reference_id).toBe('contest-123');
      expect(context.description).toContain('Summer Photo Contest');
      expect(context.content_type).toBe('contest');
    });

    it('should generate context for CHAMA_CONTRIBUTION', async () => {
      const mockChama = {
        id: 'chama-123',
        name: 'Friends Savings Group',
      };
      (prisma.chama.findUnique as jest.Mock).mockResolvedValue(mockChama as any);

      const context = await transactionContextService.getContextForType(
        TransactionType.CHAMA_CONTRIBUTION,
        'chama-123'
      );

      expect(context.type).toBe(TransactionType.CHAMA_CONTRIBUTION);
      expect(context.reference_id).toBe('chama-123');
      expect(context.description).toContain('Friends Savings Group');
      expect(context.content_type).toBe('chama');
    });

    it('should generate context for WITHDRAWAL', async () => {
      const context = await transactionContextService.getContextForType(
        TransactionType.WITHDRAWAL,
        '',
        { amount: 5000 }
      );

      expect(context.type).toBe(TransactionType.WITHDRAWAL);
      expect(context.description).toContain('Withdrawal');
      expect(context.description).toContain('5000');
    });

    it('should generate context for TOP_UP', async () => {
      const context = await transactionContextService.getContextForType(
        TransactionType.TOP_UP,
        '',
        { amount: 1000 }
      );

      expect(context.type).toBe(TransactionType.TOP_UP);
      expect(context.description).toContain('Top up');
      expect(context.description).toContain('1000');
    });

    it('should handle database errors gracefully', async () => {
      (prisma.post.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const context = await transactionContextService.getContextForType(
        TransactionType.CONTENT_TIP,
        'post-123'
      );

      // Should return basic context without throwing
      expect(context.type).toBe(TransactionType.CONTENT_TIP);
      expect(context.reference_id).toBe('post-123');
      expect(context.description).toBeDefined();
    });
  });

  describe('validateContextOrThrow', () => {
    it('should not throw for valid context', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: 'post-123' } as any);

      const context: Partial<TransactionContext> = {
        type: TransactionType.CONTENT_TIP,
        reference_id: 'post-123',
        description: 'Tip to creator on post',
      };

      await expect(
        transactionContextService.validateContextOrThrow(context)
      ).resolves.not.toThrow();
    });

    it('should throw for invalid context', async () => {
      const context: Partial<TransactionContext> = {
        reference_id: 'post-123',
        description: 'Tip to creator',
      };

      await expect(
        transactionContextService.validateContextOrThrow(context)
      ).rejects.toThrow('Invalid transaction context');
    });
  });

  describe('isBlockedType', () => {
    it('should return true for WALLET_TRANSFER', () => {
      expect(transactionContextService.isBlockedType('WALLET_TRANSFER')).toBe(true);
    });

    it('should return true for CHAT_TIP', () => {
      expect(transactionContextService.isBlockedType('CHAT_TIP')).toBe(true);
    });

    it('should return false for CONTENT_TIP', () => {
      expect(transactionContextService.isBlockedType('CONTENT_TIP')).toBe(false);
    });
  });

  describe('isValidType', () => {
    it('should return true for valid transaction types', () => {
      expect(transactionContextService.isValidType('CONTENT_TIP')).toBe(true);
      expect(transactionContextService.isValidType('SUBSCRIPTION')).toBe(true);
      expect(transactionContextService.isValidType('WITHDRAWAL')).toBe(true);
    });

    it('should return false for invalid transaction types', () => {
      expect(transactionContextService.isValidType('INVALID_TYPE')).toBe(false);
      expect(transactionContextService.isValidType('RANDOM_STRING')).toBe(false);
    });
  });
});
