/**
 * Transaction Context Service
 * 
 * This service validates that all transactions have proper context (type, reference_id, description)
 * to comply with regulatory requirements. It ensures no "blank" transfers are allowed.
 * 
 * Task: 2.1 Create TransactionContext service
 * Requirements: 2.2.1
 */

import { prisma } from '../../config/database.js';
import { Logger } from '../../utils/logger.js';
import {
  TransactionType,
  TransactionContext,
  ContextValidationResult,
  validateTransactionContext,
  getTransactionTypeMetadata,
  isBlockedTransactionType,
  isValidTransactionType,
} from '../../types/transaction.types.js';

const logger = new Logger('TransactionContext');

export class TransactionContextService {
  /**
   * Validate transaction context
   * 
   * Checks all required fields and validates reference_id existence
   * 
   * @param context - Transaction context to validate
   * @returns Validation result with errors and warnings
   */
  async validateContext(context: Partial<TransactionContext>): Promise<ContextValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Basic validation using type-level validation
    const basicValidation = validateTransactionContext(context);
    errors.push(...basicValidation.errors);
    if (basicValidation.warnings) {
      warnings.push(...basicValidation.warnings);
    }

    // If basic validation failed, return early
    if (!basicValidation.valid) {
      return {
        valid: false,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    // 2. Validate reference_id existence (check if content/service exists)
    if (context.type && context.reference_id) {
      const referenceValidation = await this.validateReferenceId(
        context.type,
        context.reference_id
      );

      if (!referenceValidation.valid) {
        errors.push(...referenceValidation.errors);
      }
      if (referenceValidation.warnings) {
        warnings.push(...referenceValidation.warnings);
      }
    }

    // 3. Validate description is meaningful (not just whitespace)
    if (context.description && context.description.trim().length < 5) {
      warnings.push('Transaction description is too short. Provide a meaningful description.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate that reference_id points to an existing entity
   * 
   * @param type - Transaction type
   * @param referenceId - Reference ID to validate
   * @returns Validation result
   */
  private async validateReferenceId(
    type: TransactionType,
    referenceId: string
  ): Promise<ContextValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      let exists = false;

      switch (type) {
        case TransactionType.CONTENT_TIP:
          // Check if post, short, or video exists
          const post = await prisma.post.findUnique({
            where: { id: referenceId },
            select: { id: true },
          });
          const short = await prisma.shorts.findUnique({
            where: { id: referenceId },
            select: { id: true },
          });
          exists = !!(post || short);
          if (!exists) {
            errors.push(`Content with ID ${referenceId} does not exist`);
          }
          break;

        case TransactionType.LOCKED_CHAT_TASK:
          // Check if chat task unlock exists
          const chatTask = await prisma.chat_task_unlocks.findUnique({
            where: { id: referenceId },
            select: { id: true },
          });
          exists = !!chatTask;
          if (!exists) {
            errors.push(`Chat task with ID ${referenceId} does not exist`);
          }
          break;

        case TransactionType.SUBSCRIPTION:
          // Check if subscription tier exists
          const subscription = await prisma.subscription_tier.findUnique({
            where: { id: referenceId },
            select: { id: true },
          });
          exists = !!subscription;
          if (!exists) {
            errors.push(`Subscription tier with ID ${referenceId} does not exist`);
          }
          break;

        case TransactionType.CONTEST_ENTRY:
        case TransactionType.CONTEST_VOTE:
        case TransactionType.CONTEST_PRIZE:
          // Check if contest exists
          const contest = await prisma.contest.findUnique({
            where: { id: referenceId },
            select: { id: true },
          });
          exists = !!contest;
          if (!exists) {
            errors.push(`Contest with ID ${referenceId} does not exist`);
          }
          break;

        case TransactionType.CHAMA_CONTRIBUTION:
        case TransactionType.CHAMA_PAYOUT:
          // Check if chama exists
          const chama = await prisma.chama.findUnique({
            where: { id: referenceId },
            select: { id: true },
          });
          exists = !!chama;
          if (!exists) {
            errors.push(`Chama with ID ${referenceId} does not exist`);
          }
          break;

        case TransactionType.SHOP_LISTING_FEE:
          // Check if product exists
          const product = await prisma.products.findUnique({
            where: { id: referenceId },
            select: { id: true },
          });
          exists = !!product;
          if (!exists) {
            errors.push(`Product with ID ${referenceId} does not exist`);
          }
          break;

        case TransactionType.PLATFORM_REWARD:
        case TransactionType.WITHDRAWAL:
        case TransactionType.TOP_UP:
          // These types don't require reference validation
          exists = true;
          break;

        default:
          warnings.push(`Unknown transaction type: ${type}. Skipping reference validation.`);
          exists = true;
          break;
      }

      return {
        valid: exists,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      logger.error('Error validating reference ID', { type, referenceId, error });
      errors.push('Failed to validate reference ID. Please try again.');
      return {
        valid: false,
        errors,
      };
    }
  }

  /**
   * Generate context for a transaction based on type
   * 
   * @param type - Transaction type
   * @param referenceId - Reference ID (content/service ID)
   * @param additionalInfo - Additional information for context generation
   * @returns Generated transaction context
   */
  async getContextForType(
    type: TransactionType,
    referenceId: string,
    additionalInfo?: {
      amount?: number;
      counterpartyName?: string;
      contentType?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<TransactionContext> {
    const metadata = getTransactionTypeMetadata(type);
    let description = '';
    let contentType = additionalInfo?.contentType;

    try {
      switch (type) {
        case TransactionType.CONTENT_TIP:
          // Fetch content details to generate description
          const post = await prisma.post.findUnique({
            where: { id: referenceId },
            select: { id: true, User: { select: { display_name: true } } },
          });
          const short = await prisma.shorts.findUnique({
            where: { id: referenceId },
            select: { id: true, User: { select: { display_name: true } } },
          });

          const content = post || short;
          const creatorName = additionalInfo?.counterpartyName || content?.user?.display_name || 'user';
          contentType = post ? 'post' : short ? 'short' : contentType;
          description = `Tip to ${creatorName} on ${contentType || 'content'}`;
          break;

        case TransactionType.LOCKED_CHAT_TASK:
          const chatTask = await prisma.chat_task_unlocks.findUnique({
            where: { id: referenceId },
            select: { task_description: true, creator_id: true },
          });
          const taskCreatorName = additionalInfo?.counterpartyName || 'user';
          const taskDesc = chatTask?.task_description || 'task';
          description = `Unlock chat with ${taskCreatorName} for: ${taskDesc}`;
          contentType = 'chat_task';
          break;

        case TransactionType.SUBSCRIPTION:
          const subscription = await prisma.subscription_tier.findUnique({
            where: { id: referenceId },
            select: { tier: true, User: { select: { display_name: true } } },
          });
          const subCreatorName = additionalInfo?.counterpartyName || subscription?.user?.display_name || 'user';
          const tier = subscription?.tier || 'subscription';
          description = `${tier} subscription to ${subCreatorName}`;
          contentType = 'subscription';
          break;

        case TransactionType.CONTEST_ENTRY:
          const contestEntry = await prisma.contest.findUnique({
            where: { id: referenceId },
            select: { title: true },
          });
          const contestTitle = contestEntry?.title || 'contest';
          description = `Entry fee for contest: ${contestTitle}`;
          contentType = 'contest';
          break;

        case TransactionType.CONTEST_VOTE:
          const contestVote = await prisma.contest.findUnique({
            where: { id: referenceId },
            select: { title: true },
          });
          const voteContestTitle = contestVote?.title || 'contest';
          description = `Vote in contest: ${voteContestTitle}`;
          contentType = 'contest';
          break;

        case TransactionType.CONTEST_PRIZE:
          const contestPrize = await prisma.contest.findUnique({
            where: { id: referenceId },
            select: { title: true },
          });
          const prizeContestTitle = contestPrize?.title || 'contest';
          description = `Prize from contest: ${prizeContestTitle}`;
          contentType = 'contest';
          break;

        case TransactionType.CHAMA_CONTRIBUTION:
          const chamaContrib = await prisma.chama.findUnique({
            where: { id: referenceId },
            select: { name: true },
          });
          const chamaName = chamaContrib?.name || 'chama';
          description = `Contribution to ${chamaName}`;
          contentType = 'chama';
          break;

        case TransactionType.CHAMA_PAYOUT:
          const chamaPayout = await prisma.chama.findUnique({
            where: { id: referenceId },
            select: { name: true },
          });
          const payoutChamaName = chamaPayout?.name || 'chama';
          description = `Payout from ${payoutChamaName}`;
          contentType = 'chama';
          break;

        case TransactionType.SHOP_LISTING_FEE:
          const product = await prisma.products.findUnique({
            where: { id: referenceId },
            select: { title: true },
          });
          const productName = product?.title || 'product';
          description = `Listing fee for: ${productName}`;
          contentType = 'product';
          break;

        case TransactionType.PLATFORM_REWARD:
          description = 'Platform reward';
          break;

        case TransactionType.WITHDRAWAL:
          description = `Withdrawal to fiat (${additionalInfo?.amount || 0} Kr)`;
          break;

        case TransactionType.TOP_UP:
          description = `Top up wallet (${additionalInfo?.amount || 0} Kr)`;
          break;

        default:
          description = metadata.description;
          break;
      }

      return {
        type,
        reference_id: referenceId,
        description,
        content_type: contentType,
        metadata: additionalInfo?.metadata,
      };
    } catch (error) {
      logger.error('Error generating context', { type, referenceId, error });
      // Return a basic context if generation fails
      return {
        type,
        reference_id: referenceId,
        description: metadata.description,
        content_type: contentType,
        metadata: additionalInfo?.metadata,
      };
    }
  }

  /**
   * Validate and throw error if context is invalid
   * 
   * @param context - Transaction context to validate
   * @throws Error if context is invalid
   */
  async validateContextOrThrow(context: Partial<TransactionContext>): Promise<void> {
    const validation = await this.validateContext(context);

    if (!validation.valid) {
      const errorMessage = validation.errors.join('; ');
      logger.error('Invalid transaction context', { context, errors: validation.errors });
      throw new Error(`Invalid transaction context: ${errorMessage}`);
    }

    if (validation.warnings && validation.warnings.length > 0) {
      logger.warn('Transaction context warnings', { context, warnings: validation.warnings });
    }
  }

  /**
   * Check if a transaction type is blocked
   * 
   * @param type - Transaction type to check
   * @returns True if blocked, false otherwise
   */
  isBlockedType(type: string): boolean {
    return isBlockedTransactionType(type);
  }

  /**
   * Check if a transaction type is valid
   * 
   * @param type - Transaction type to check
   * @returns True if valid, false otherwise
   */
  isValidType(type: string): boolean {
    return isValidTransactionType(type);
  }
}

export const transactionContextService = new TransactionContextService();
