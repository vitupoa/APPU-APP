import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';
import { emitVoteUpdate, emitContestUpdate } from '../../shared/gateway/events';

const PLATFORM_FEE_RATE = 0.15; // 15%

export class ContestService {
  /**
   * Creates contest with escrowed prize + 15% platform fee.
   * Atomically deducts from creator wallet.
   */
  static async createContest(data: {
    creatorId: string;
    title: string;
    description: string;
    mediaType: string;
    category: string;
    prizeKr: number;
    requiredActions: { type: string; targetUrl?: string; label: string }[];
    maxWinners: number;
    prizeDistribution: { rank: number; percentage: number }[];
    judgingCriteria: string;
    sponsorName?: string;
    sponsorUrl?: string;
    deadline: Date;
    coverMediaUrl?: string;

    // Gamification Upgrades
    entryFeeKr?: number;
    publicVoteWeight?: number;
    allowDailyPrizes?: boolean;
    dailyPrizeKr?: number;
    targetAges?: number[];
    targetGeos?: string[];
    airdropKr?: number;
    airdropLimit?: number;
    judges?: string[]; // Array of judge userIds explicitly defined in step 5 mapping to the combination algorithm
  }) {
    const platformFeeKr = data.prizeKr * PLATFORM_FEE_RATE;
    
    // Calculate total duration in days dynamically locking the daily prize pool Escrow natively
    const durationMs = data.deadline.getTime() - new Date().getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    
    const totalDailyPrizePool = data.allowDailyPrizes && data.dailyPrizeKr ? (data.dailyPrizeKr * durationDays) : 0;
    const airdropTotalPool = (data.airdropKr && data.airdropLimit) ? (data.airdropKr * data.airdropLimit) : 0;
    
    // Massive Escrow Calculation blocking fraudulent contest creations natively 
    const totalChargedKr = new Prisma.Decimal(data.prizeKr + platformFeeKr + totalDailyPrizePool + airdropTotalPool);
    const prizeKr = new Prisma.Decimal(data.prizeKr);
    const feeKr = new Prisma.Decimal(platformFeeKr);

    return prisma.$transaction(async (tx) => {
      // Verify creator balance
      const wallet = await tx.wallet.findUnique({ where: { userId: data.creatorId } });
      if (!wallet || wallet.krBalance.lessThan(totalChargedKr)) {
        throw new Error(
          `Insufficient balance. Need Kr.${totalChargedKr.toFixed(2)} (prize + 15% platform fee)`
        );
      }

      // Deduct from creator wallet
      await tx.wallet.update({
        where: { userId: data.creatorId },
        data: { krBalance: { decrement: totalChargedKr } }
      });

      // Create contest
      const contest = await tx.contest.create({
        data: {
          creatorId: data.creatorId,
          title: data.title,
          description: data.description,
          mediaType: data.mediaType as any,
          category: data.category,
          coverMediaUrl: data.coverMediaUrl,
          prizeTotalKr: prizeKr,
          platformFeeKr: feeKr,
          maxWinners: data.maxWinners,
          judgingCriteria: data.judgingCriteria as any,
          sponsorName: data.sponsorName ?? null,
          sponsorUrl: data.sponsorUrl ?? null,
          deadline: data.deadline,
          status: 'ACTIVE',
          
          // Inject Gamification
          entryFeeKr: data.entryFeeKr ? new Prisma.Decimal(data.entryFeeKr) : null,
          publicVoteWeight: data.publicVoteWeight,
          allowDailyPrizes: data.allowDailyPrizes ?? false,
          dailyPrizeKr: data.dailyPrizeKr ? new Prisma.Decimal(data.dailyPrizeKr) : null,
          targetAges: data.targetAges,
          targetGeos: data.targetGeos,
          airdropKr: data.airdropKr ? new Prisma.Decimal(data.airdropKr) : null,
          airdropLimit: data.airdropLimit,
          
          // Relational Maps
          judges: data.judges && data.judges.length > 0 ? {
             create: data.judges.map((j) => ({ userId: j }))
          } : undefined,
          actions: {
            create: data.requiredActions.map((a, i) => ({
              actionType: a.type as any,
              targetUrl: a.targetUrl ?? '',
              label: a.label,
              sortOrder: i
            }))
          },
          distributions: {
            create: data.prizeDistribution.map((d) => ({
              rank: d.rank,
              percentage: new Prisma.Decimal(d.percentage)
            }))
          }
        },
        include: {
          creator: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          actions: true,
          distributions: true
        }
      });

      // Record escrow transaction
      await tx.transaction.create({
        data: {
          userId: data.creatorId,
          type: 'contest_escrow',
          amountKr: totalChargedKr,
          status: 'completed',
          provider: 'platform',
          reference: contest.id
        }
      });

      // Create escrow record
      await tx.escrow.create({
        data: {
          contestId: contest.id,
          userId: data.creatorId,
          prizeAmountKr: prizeKr,
          feeAmountKr: feeKr,
          status: 'held'
        }
      });

      return {
        ...contest,
        prizeKr: contest.prizeTotalKr,
        platformFeeKr: contest.platformFeeKr,
        totalChargedKr: totalChargedKr,
        participantsCount: 0,
        submissionsCount: 0,
        createdAt: contest.createdAt.toISOString()
      };
    });
  }

  static async listContests(params: {
    status?: string;
    cursor?: string;
    limit: number;
    userId?: string;
  }) {
    const { status, cursor, limit, userId } = params;

    const contests = await prisma.contest.findMany({
      where: status ? { status: status as any } : undefined,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
      }
    });

    const hasMore = contests.length > limit;
    const items = hasMore ? contests.slice(0, limit) : contests;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Check if user has joined each contest
    const joinedIds = new Set<string>();
    if (userId) {
      const joined = await prisma.contestParticipant.findMany({
        where: { userId, contestId: { in: items.map((c) => c.id) } },
        select: { contestId: true }
      });
      joined.forEach((j: { contestId: string }) => joinedIds.add(j.contestId));
    }

    return {
      items: items.map((c: any) => ({
        id: c.id,
        creator: c.creator,
        title: c.title,
        description: c.description,
        mediaType: c.mediaType,
        contestCategory: c.category,
        prizeKr: Number(c.prizeTotalKr),
        platformFeeKr: Number(c.platformFeeKr),
        totalChargedKr: Number(c.prizeTotalKr) + Number(c.platformFeeKr),
        maxWinners: c.maxWinners,
        judgingCriteria: c.judgingCriteria,
        sponsorName: c.sponsorName,
        sponsorUrl: c.sponsorUrl,
        deadline: c.deadline.toISOString(),
        coverMediaUrl: c.coverMediaUrl,
        status: c.status,
        participantsCount: c.totalParticipants,
        submissionsCount: c.totalSubmissions,
        isJoined: joinedIds.has(c.id),
        createdAt: c.createdAt.toISOString()
      })),
      nextCursor
    };
  }

  static async getContestById(contestId: string, userId?: string) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: contestId },
      include: {
        creator: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        actions: { orderBy: { sortOrder: 'asc' } },
        distributions: { orderBy: { rank: 'asc' } }
      }
    });

    const isJoined = userId
      ? !!(await prisma.contestParticipant.findUnique({
          where: { contestId_userId: { contestId, userId } }
        }))
      : false;

    return {
      id: contest.id,
      creator: contest.creator,
      title: contest.title,
      description: contest.description,
      mediaType: contest.mediaType,
      contestCategory: contest.category,
      prizeKr: Number(contest.prizeTotalKr),
      platformFeeKr: Number(contest.platformFeeKr),
      totalChargedKr: Number(contest.prizeTotalKr) + Number(contest.platformFeeKr),
      rules: contest.actions.map((a: any) => a.label),
      requiredActions: contest.actions.map((a: any) => ({
        type: a.actionType,
        targetUrl: a.targetUrl,
        label: a.label
      })),
      maxWinners: contest.maxWinners,
      judgingCriteria: contest.judgingCriteria,
      sponsorName: contest.sponsorName,
      sponsorUrl: contest.sponsorUrl,
      deadline: contest.deadline.toISOString(),
      coverMediaUrl: contest.coverMediaUrl,
      status: contest.status,
      participantsCount: contest.totalParticipants,
      submissionsCount: contest.totalSubmissions,
      isJoined,
      createdAt: contest.createdAt.toISOString()
    };
  }

  static async joinContest(userId: string, contestId: string) {
    const contest = await prisma.contest.findUniqueOrThrow({ where: { id: contestId } });
    if (contest.status !== 'ACTIVE') {
      throw new Error('Contest is no longer active');
    }

    // Upsert-like check using compound unique
    const existing = await prisma.contestParticipant.findUnique({
      where: { contestId_userId: { contestId, userId } }
    });
    if (existing) throw new Error('Already joined this contest');

    const [participant] = await prisma.$transaction([
      prisma.contestParticipant.create({ data: { userId, contestId } }),
      prisma.contest.update({ where: { id: contestId }, data: { totalParticipants: { increment: 1 } } })
    ]);

    // Emit contest update
    emitContestUpdate(contestId, contest.status, contest.totalParticipants + 1);

    return participant;
  }

  static async submitEntry(data: {
    userId: string;
    contestId: string;
    mediaUrl: string;
    mediaType: string;
    proofUrls?: string[];
  }) {
    const contest = await prisma.contest.findUniqueOrThrow({ where: { id: data.contestId } });
    if (contest.status !== 'ACTIVE') throw new Error('Contest is not accepting submissions');

    // Must be a participant
    const participant = await prisma.contestParticipant.findUnique({
      where: { contestId_userId: { contestId: data.contestId, userId: data.userId } }
    });
    if (!participant) throw new Error('You must join this contest before submitting');

    const [submission] = await prisma.$transaction([
      prisma.contestSubmission.create({
        data: {
          userId: data.userId,
          contestId: data.contestId,
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          proofUrls: data.proofUrls || []
        },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
        }
      }),
      prisma.contest.update({ where: { id: data.contestId }, data: { totalSubmissions: { increment: 1 } } })
    ]);

    return {
      ...submission,
      votes: submission.votesCount,
      proofScreenshots: submission.proofUrls,
      createdAt: submission.submittedAt.toISOString()
    };
  }

  static async getSubmissions(contestId: string, cursor?: string, limit = 20) {
    const submissions = await prisma.contestSubmission.findMany({
      where: { contestId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
      }
    });

    const hasMore = submissions.length > limit;
    const items = hasMore ? submissions.slice(0, limit) : submissions;
    return {
      items: items.map((s) => ({
        id: s.id,
        user: s.user,
        contestId: s.contestId,
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        proofScreenshots: s.proofUrls,
        votes: s.votesCount,
        rank: s.rank,
        createdAt: s.submittedAt.toISOString()
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  static async getLeaderboard(contestId: string) {
    const submissions = await prisma.contestSubmission.findMany({
      where: { contestId },
      orderBy: [{ votesCount: 'desc' }, { submittedAt: 'asc' }],
      take: 50,
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
      }
    });

    return submissions.map((s) => ({
      id: s.id,
      user: s.user,
      contestId: s.contestId,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      proofScreenshots: s.proofUrls,
      votes: s.votesCount,
      rank: s.rank,
      createdAt: s.submittedAt.toISOString()
    }));
  }

  /**
   * Get all contest submissions feed from active contests
   */
  static async getSubmissionsFeed(cursor?: string, limit = 20, userId?: string) {
    const submissions = await prisma.contestSubmission.findMany({
      where: {
        contest: { status: 'ACTIVE' }
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
        contest: {
          select: {
            id: true,
            title: true,
            prizeTotalKr: true,
            status: true
          }
        }
      }
    });

    const hasMore = submissions.length > limit;
    const items = hasMore ? submissions.slice(0, limit) : submissions;

    return {
      items: items.map((s) => ({
        id: s.id,
        user: s.user,
        contestId: s.contestId,
        contest: {
          id: s.contest.id,
          title: s.contest.title,
          prizeKr: Number(s.contest.prizeTotalKr),
          status: s.contest.status
        },
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        caption: '', // Add caption field if needed
        proofScreenshots: s.proofUrls,
        votes: s.votesCount,
        rank: s.rank,
        createdAt: s.submittedAt.toISOString()
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  /**
   * Vote on a contest submission
   */
  static async voteOnSubmission(userId: string, submissionId: string, voteType: 'UPVOTE' | 'DOWNVOTE') {
    const submission = await prisma.contestSubmission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { contest: true }
    });

    if (submission.contest.status !== 'ACTIVE') {
      throw new Error('Contest is not active');
    }

    if (submission.userId === userId) {
      throw new Error('Cannot vote on your own submission');
    }

    return prisma.$transaction(async (tx) => {
      // Check if user already voted
      const existingVote = await tx.contestVote.findUnique({
        where: {
          submissionId_voterId: { submissionId, voterId: userId }
        }
      });

      if (existingVote) {
        throw new Error('You have already voted on this submission');
      }

      // Create new vote
      await tx.contestVote.create({
        data: {
          voterId: userId,
          submissionId
        }
      });

      // Update counts
      await tx.contestSubmission.update({
        where: { id: submissionId },
        data: { votesCount: { increment: 1 } }
      });

      // Get updated submission
      const updated = await tx.contestSubmission.findUniqueOrThrow({
        where: { id: submissionId }
      });

      // Emit real-time vote update
      emitVoteUpdate(submissionId, updated.votesCount, userId);

      return {
        success: true,
        newVoteCount: updated.votesCount
      };
    });
  }

  /**
   * Distributes prizes to winners atomically.
   * Uses prize distribution percentages from the contest.
   */
  static async distributeContestPrizes(contestId: string, winnerIds: string[]) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: contestId },
      include: { distributions: { orderBy: { rank: 'asc' } } }
    });
    if (contest.status !== 'JUDGING') throw new Error('Contest is not in JUDGING state');

    const totalPrize = Number(contest.prizeTotalKr);

    return prisma.$transaction(async (tx) => {
      for (const [index, winnerId] of winnerIds.entries()) {
        const distribution = contest.distributions[index];
        const prizeAmount = distribution
          ? new Prisma.Decimal(totalPrize * Number(distribution.percentage) / 100)
          : new Prisma.Decimal(totalPrize / winnerIds.length);

        // Credit winner wallet
        await tx.wallet.upsert({
          where: { userId: winnerId },
          create: { userId: winnerId, krBalance: prizeAmount },
          update: { krBalance: { increment: prizeAmount } }
        });

        // Record transaction
        await tx.transaction.create({
          data: {
            userId: winnerId,
            type: 'contest_prize',
            amountKr: prizeAmount,
            status: 'completed',
            provider: 'platform',
            reference: contestId
          }
        });

        // Record winner
        await tx.contestWinner.create({
          data: {
            contestId,
            userId: winnerId,
            rank: index + 1,
            prizeKr: prizeAmount
          }
        });

        // Unlock wallet on first prize income
        await tx.user.update({
          where: { id: winnerId },
          data: { isWalletUnlocked: true }
        });
      }

      // Release escrow
      await tx.escrow.updateMany({
        where: { contestId, status: 'held' },
        data: { status: 'released' }
      });

      // Mark contest completed
      await tx.contest.update({
        where: { id: contestId },
        data: { status: 'COMPLETED' }
      });
    });
  }
}
