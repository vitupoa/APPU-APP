import { TransactionContext } from '../../types/transaction.types';

export interface VelocityCheckResult {
  allowed: boolean;
  reason?: string;
  waitTimeSeconds?: number;
}

export interface RiskAnalysisResult {
  score: number;
  level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flagged: boolean;
  patterns: {
    deviceSharing: {
      score: number;
      sharedDeviceUsers: string[];
      tipsToSharedUsers: number;
    };
    interactionExclusivity: {
      score: number;
      exclusiveInteractions: number;
      totalInteractions: number;
    };
    rapidCycles: {
      score: number;
      cycleCount: number;
    };
    circularPatterns: {
      score: number;
      circularTransactions: number;
    };
  };
}

declare module 'express-serve-static-core' {
  interface Request {
    transactionContext?: Partial<TransactionContext> & {
      transactionType?: string;
    };
  }
}
