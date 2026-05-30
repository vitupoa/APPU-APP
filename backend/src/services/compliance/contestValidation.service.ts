import { prisma } from '../../config/database.js';
import { Logger } from '../../utils/logger.js';
import { JudgingMethod } from '@prisma/client';

const logger = new Logger('ContestValidation');

export class ContestValidationService {
  /**
   * Validate contest configuration for gambling compliance
   */
  async validateContestConfig(data: {
    entry_fee_kr?: number;
    voting_enabled?: boolean;
    voting_cost_per_vote_kr?: number;
    judging_method?: JudgingMethod;
    judge_weight_percentage?: number;
    vote_weight_percentage?: number;
    max_judges?: number;
  }): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const entryFee = data.entry_fee_kr || 0;
    const votingCost = data.voting_cost_per_vote_kr || 0;
    const votingEnabled = data.voting_enabled !== false;

    // CRITICAL RULE: Cannot charge both entry fee AND voting fee (gambling compliance)
    if (entryFee > 0 && votingCost > 0) {
      errors.push('Paid voting is only allowed for free-entry contests (gambling compliance)');
    }

    // Validate judging method
    const validJudgingMethods: JudgingMethod[] = ['JUDGES_ONLY', 'VOTES_ONLY', 'JUDGES_AND_VOTES'];
    if (data.judging_method && !validJudgingMethods.includes(data.judging_method)) {
      errors.push(`Invalid judging method. Must be one of: ${validJudgingMethods.join(', ')}`);
    }

    // Validate weights for combined judging
    if (data.judging_method === 'JUDGES_AND_VOTES') {
      const judgeWeight = data.judge_weight_percentage || 0;
      const voteWeight = data.vote_weight_percentage || 0;

      if (judgeWeight + voteWeight !== 100) {
        errors.push('Judge weight and vote weight must sum to 100%');
      }

      if (judgeWeight < 0 || judgeWeight > 100) {
        errors.push('Judge weight must be between 0 and 100');
      }

      if (voteWeight < 0 || voteWeight > 100) {
        errors.push('Vote weight must be between 0 and 100');
      }
    }

    // Validate max judges
    if (data.max_judges && (data.max_judges < 1 || data.max_judges > 15)) {
      errors.push('Number of judges must be between 1 and 15');
    }

    // Warnings
    if (entryFee > 10000) {
      warnings.push('High entry fee may discourage participation');
    }

    if (votingCost > 100) {
      warnings.push('High voting cost may discourage engagement');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate contest before creation
   */
  async validateContestCreation(contestData: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const validation = await this.validateContestConfig(contestData);

    // Additional creation-specific validations
    if (contestData.prize_total_kr <= 0) {
      validation.errors.push('Prize pool must be greater than 0');
    }

    if (contestData.deadline && new Date(contestData.deadline) <= new Date()) {
      validation.errors.push('Contest deadline must be in the future');
    }

    if (contestData.max_winners < 1 || contestData.max_winners > 3) {
      validation.errors.push('Number of winners must be between 1 and 3');
    }

    return validation;
  }

  /**
   * Update contest validation flags in database
   */
  async updateContestValidation(contestId: string): Promise<void> {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId }
    });

    if (!contest) {
      throw new Error('Contest not found');
    }

    const validation = await this.validateContestConfig({
      entry_fee_kr: Number(contest.entry_fee_kr || 0),
      voting_enabled: contest.voting_enabled,
      voting_cost_per_vote_kr: Number(contest.voting_cost_per_vote_kr || 0),
      judging_method: contest.judging_method || undefined,
      judge_weight_percentage: contest.judge_weight_percentage || undefined,
      vote_weight_percentage: contest.vote_weight_percentage || undefined
    });

    await prisma.contest.update({
      where: { id: contestId },
      data: {
        is_legal_structure: validation.isValid,
        validation_errors: validation.errors
      }
    });

    if (!validation.isValid) {
      logger.warn(`Contest ${contestId} has validation errors:`, validation.errors);
    }
  }

  /**
   * Get contest validation status
   */
  async getContestValidationStatus(contestId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId }
    });

    if (!contest) {
      throw new Error('Contest not found');
    }

    return await this.validateContestConfig({
      entry_fee_kr: Number(contest.entry_fee_kr || 0),
      voting_enabled: contest.voting_enabled,
      voting_cost_per_vote_kr: Number(contest.voting_cost_per_vote_kr || 0),
      judging_method: contest.judging_method || undefined,
      judge_weight_percentage: contest.judge_weight_percentage || undefined,
      vote_weight_percentage: contest.vote_weight_percentage || undefined
    });
  }

  /**
   * Validate prize distribution
   */
  validatePrizeDistribution(distributions: { rank: number; percentage: number }[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check total percentage
    const totalPercentage = distributions.reduce((sum, d) => sum + d.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      errors.push('Prize distribution must sum to 100%');
    }

    // Check individual percentages
    for (const dist of distributions) {
      if (dist.percentage < 0 || dist.percentage > 100) {
        errors.push(`Invalid percentage for rank ${dist.rank}: ${dist.percentage}%`);
      }
    }

    // Check ranks are sequential
    const ranks = distributions.map(d => d.rank).sort((a, b) => a - b);
    for (let i = 0; i < ranks.length; i++) {
      if (ranks[i] !== i + 1) {
        errors.push('Prize distribution ranks must be sequential (1, 2, 3)');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate final scores for contest submissions
   */
  async calculateFinalScores(contestId: string): Promise<void> {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        ContestSubmission: {
          include: {
            judge_scores: true,
            contest_votes: true
          }
        }
      }
    });

    if (!contest) {
      throw new Error('Contest not found');
    }

    const judgingMethod = contest.judging_method || 'VOTES_ONLY';
    const judgeWeight = (contest.judge_weight_percentage || 0) / 100;
    const voteWeight = (contest.vote_weight_percentage || 100) / 100;

    for (const submission of contest.ContestSubmission) {
      let finalScore = 0;

      switch (judgingMethod) {
        case 'JUDGES_ONLY':
          // Average of judge scores
          if (submission.judge_scores.length > 0) {
            const avgJudgeScore = submission.judge_scores.reduce(
              (sum, s) => sum + Number(s.score),
              0
            ) / submission.judge_scores.length;
            finalScore = avgJudgeScore;
          }
          break;

        case 'VOTES_ONLY':
          // Vote count
          finalScore = submission.votes_count;
          break;

        case 'JUDGES_AND_VOTES':
          // Weighted combination
          let judgeScore = 0;
          if (submission.judge_scores.length > 0) {
            judgeScore = submission.judge_scores.reduce(
              (sum, s) => sum + Number(s.score),
              0
            ) / submission.judge_scores.length;
          }

          const voteScore = submission.votes_count;

          // Normalize scores to 0-100 scale
          const normalizedJudgeScore = judgeScore; // Already 0-100
          const maxVotes = Math.max(...contest.ContestSubmission.map(s => s.votes_count));
          const normalizedVoteScore = maxVotes > 0 ? (voteScore / maxVotes) * 100 : 0;

          finalScore = (normalizedJudgeScore * judgeWeight) + (normalizedVoteScore * voteWeight);
          break;
      }

      // Update submission with final score
      await prisma.contestSubmission.update({
        where: { id: submission.id },
        data: { final_score: finalScore }
      });
    }

    // Rank submissions
    const submissions = await prisma.contestSubmission.findMany({
      where: { contest_id: contestId },
      orderBy: { final_score: 'desc' }
    });

    for (let i = 0; i < submissions.length; i++) {
      await prisma.contestSubmission.update({
        where: { id: submissions[i].id },
        data: { rank: i + 1 }
      });
    }

    logger.info(`Final scores calculated for contest ${contestId}`);
  }
}

export const contestValidationService = new ContestValidationService();
