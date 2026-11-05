/**
 * Transaction Types and Context Definitions
 * 
 * This file defines TypeScript types for transaction context validation
 * and provides type-safe interfaces for working with transactions.
 * 
 * Task: 1.1 Update transaction schema with context fields
 */

/**
 * Valid transaction types for platform compliance
 * 
 * Note: WALLET_TRANSFER and CHAT_TIP are explicitly excluded
 * to prevent money transmission classification.
 */
export enum TransactionType {
  CONTENT_TIP = 'CONTENT_TIP',
  LOCKED_CHAT_TASK = 'LOCKED_CHAT_TASK',
  SUBSCRIPTION = 'SUBSCRIPTION',
  CONTEST_ENTRY = 'CONTEST_ENTRY',
  CONTEST_VOTE = 'CONTEST_VOTE',
  CONTEST_PRIZE = 'CONTEST_PRIZE',  PLATFORM_REWARD = 'PLATFORM_REWARD',
  WITHDRAWAL = 'WITHDRAWAL',
  TOP_UP = 'TOP_UP',
  SHOP_LISTING_FEE = 'SHOP_LISTING_FEE',
}

/**
 * Transaction context structure
 * 
 * All transactions must have a valid context that describes
 * the business purpose of the transaction.
 */
export interface TransactionContext {
  /** Transaction type */
  type: TransactionType;
  
  /** Reference ID to content, service, or entity */
  reference_id: string;
  
  /** Human-readable description of the transaction */
  description: string;
  
  /** Optional content type (post, short, video, etc.) */
  content_type?: string;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Transaction creation data with context
 */
export interface CreateTransactionData {
  user_id: string;
  amount_kr: number;
  amount_fiat?: number;
  currency?: string;
  provider?: string;
  status?: string;
  counterparty_id?: string;
  
  /** New structured context (preferred) */
  context?: TransactionContext;
  transaction_type?: TransactionType;
  reference_id?: string;
  description?: string;
  
  /** Legacy context fields (for backward compatibility) */
  context_type?: string;
  context_ref_id?: string;
  context_desc?: string;
  
  /** Risk and tracking */
  risk_score?: number;
  is_flagged?: boolean;
  flag_reason?: string;
  device_id?: string;
  ip_address?: string;
  user_agent?: string;
  
  /** Additional metadata */
  metadata?: any;
}

/**
 * Context validation result
 */
export interface ContextValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Transaction type metadata
 * 
 * Provides additional information about each transaction type
 * for validation and display purposes.
 */
export interface TransactionTypeMetadata {
  type: TransactionType;
  label: string;
  description: string;
  requires_reference: boolean;
  allowed_content_types?: string[];
}

/**
 * Transaction type metadata map
 */
export const TRANSACTION_TYPE_METADATA: Record<TransactionType, TransactionTypeMetadata> = {
  [TransactionType.CONTENT_TIP]: {
    type: TransactionType.CONTENT_TIP,
    label: 'Content Tip',
    description: 'Tip on post, short, or video',
    requires_reference: true,
    allowed_content_types: ['post', 'short', 'video'],
  },
  [TransactionType.LOCKED_CHAT_TASK]: {
    type: TransactionType.LOCKED_CHAT_TASK,
    label: 'Locked Chat Task',
    description: 'Pay to unlock chat for a specific task',
    requires_reference: true,
    allowed_content_types: ['chat_task'],
  },
  [TransactionType.SUBSCRIPTION]: {
    type: TransactionType.SUBSCRIPTION,
    label: 'Subscription',
    description: 'Monthly subscription to creator',
    requires_reference: true,
    allowed_content_types: ['subscription'],
  },
  [TransactionType.CONTEST_ENTRY]: {
    type: TransactionType.CONTEST_ENTRY,
    label: 'Contest Entry',
    description: 'Contest entry fee',
    requires_reference: true,
    allowed_content_types: ['contest'],
  },
  [TransactionType.CONTEST_VOTE]: {
    type: TransactionType.CONTEST_VOTE,
    label: 'Contest Vote',
    description: 'Paid vote on contest submission',
    requires_reference: true,
    allowed_content_types: ['contest', 'contest_submission'],
  },
  [TransactionType.CONTEST_PRIZE]: {
    type: TransactionType.CONTEST_PRIZE,
    label: 'Contest Prize',
    description: 'Contest prize distribution',
    requires_reference: true,
    allowed_content_types: ['contest'],
  },  [TransactionType.PLATFORM_REWARD]: {
    type: TransactionType.PLATFORM_REWARD,
    label: 'Platform Reward',
    description: 'Platform-funded reward',
    requires_reference: false,
  },
  [TransactionType.WITHDRAWAL]: {
    type: TransactionType.WITHDRAWAL,
    label: 'Withdrawal',
    description: 'Cash out to fiat',
    requires_reference: false,
  },
  [TransactionType.TOP_UP]: {
    type: TransactionType.TOP_UP,
    label: 'Top Up',
    description: 'Buy Rc with fiat',
    requires_reference: false,
  },
  [TransactionType.SHOP_LISTING_FEE]: {
    type: TransactionType.SHOP_LISTING_FEE,
    label: 'Shop Listing Fee',
    description: 'Fee to list product in shop',
    requires_reference: true,
    allowed_content_types: ['product'],
  },
};

/**
 * Blocked transaction types (for compliance)
 * 
 * These transaction types are not allowed on the platform
 * to avoid money transmission classification.
 */
export const BLOCKED_TRANSACTION_TYPES = [
  'WALLET_TRANSFER',
  'CHAT_TIP',
] as const;

/**
 * Check if a transaction type is blocked
 */
export function isBlockedTransactionType(type: string): boolean {
  return BLOCKED_TRANSACTION_TYPES.includes(type as any);
}

/**
 * Get transaction type metadata
 */
export function getTransactionTypeMetadata(type: TransactionType): TransactionTypeMetadata {
  return TRANSACTION_TYPE_METADATA[type];
}

/**
 * Validate transaction type
 */
export function isValidTransactionType(type: string): type is TransactionType {
  return Object.values(TransactionType).includes(type as TransactionType);
}

/**
 * Build context object from individual fields
 */
export function buildTransactionContext(
  type: TransactionType,
  reference_id: string,
  description: string,
  content_type?: string,
  metadata?: Record<string, any>
): TransactionContext {
  return {
    type,
    reference_id,
    description,
    content_type,
    metadata,
  };
}

/**
 * Validate transaction context
 */
export function validateTransactionContext(
  context: Partial<TransactionContext>
): ContextValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!context.type) {
    errors.push('Transaction type is required');
  } else if (!isValidTransactionType(context.type)) {
    errors.push(`Invalid transaction type: ${context.type}`);
  } else if (isBlockedTransactionType(context.type)) {
    errors.push(`Transaction type ${context.type} is blocked for compliance`);
  }

  if (!context.description || context.description.trim().length === 0) {
    errors.push('Transaction description is required');
  }

  // Check reference_id requirement based on transaction type
  if (context.type && isValidTransactionType(context.type)) {
    const metadata = getTransactionTypeMetadata(context.type);
    if (metadata.requires_reference && !context.reference_id) {
      errors.push(`Reference ID is required for ${metadata.label}`);
    }
  }

  // Check content_type if specified
  if (context.content_type && context.type && isValidTransactionType(context.type)) {
    const metadata = getTransactionTypeMetadata(context.type);
    if (metadata.allowed_content_types && 
        !metadata.allowed_content_types.includes(context.content_type)) {
      warnings.push(
        `Content type '${context.content_type}' is not typical for ${metadata.label}. ` +
        `Expected: ${metadata.allowed_content_types.join(', ')}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
