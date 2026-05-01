import { prisma } from '../../config/database.js';
import { Prisma } from '../../generated/prisma/client.js';
import { emitVoteUpdate, emitContestUpdate } from '../../shared/gateway/events.js';
import { HashtagService } from '../../shared/hashtag.service.js';
import { NotificationService } from '../../shared/services/notification.service.js';

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
    prizeTotalKr: number;
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
    const platformFeeKr = data.prizeTotalKr * PLATFORM_FEE_RATE;
    
    // Calculate total duration in days dynamically locking the daily prize pool Escrow natively
    const durationMs = data.deadline.getTime() - new Date().getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    
    const totalDailyPrizePool = data.allowDailyPrizes && data.dailyPrizeKr ? (data.dailyPrizeKr * durationDays) : 0;
    const airdropTotalPool = (data.airdropKr && data.airdropLimit) ? (data.airdropKr * data.airdropLimit) : 0;
    
    // Massive Escrow Calculation blocking fraudulent contest creations natively 
    const totalChargedKr = new Prisma.Decimal(data.prizeTotalKr + platformFeeKr + totalDailyPrizePool + airdropTotalPool);
    const prizeKr = new Prisma.Decimal(data.prizeTotalKr);
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
        contestId: contest.id,
        ...contest,
        prizeTotalKr: contest.prizeTotalKr,
        platformFeeKr: contest.platformFeeKr,
        totalChargedKr: totalChargedKr,
        totalParticipants: 0,
        submissionsCount: 0,
        createdAt: contest.createdAt.toISOString()
      };
    }).then(result => {
      // Process hashtags and mentions from description (fire-and-forget, outside transaction)
      const text = `${data.title} ${data.description}`;
      HashtagService.processContent(result.contestId, 'CONTEST', text).catch(() => {});
      return result;
    });
  }

  /**
   * Invite judges to a contest
   * Creates judge invite records with PENDING status
   */
  static async inviteJudges(contestId: string, judgeIds: string[]) {
    const contest = await prisma.contest.findUniqueOrThrow({ where: { id: contestId } });
    
    const results = {
      accepted: [] as any[],
      failed: [] as string[]
    };

    for (const judgeId of judgeIds) {
      try {
        // Check if judge exists
        const judge = await prisma.user.findUnique({ where: { id: judgeId } });
        if (!judge) {
          results.failed.push(judgeId);
          continue;
        }

        // Check if already invited
        const existing = await prisma.judgeInvite.findUnique({
          where: { contestId_judgeId: { contestId, judgeId } }
        });

        if (existing) {
          results.failed.push(judgeId);
          continue;
        }

        // Create invite
        const invite = await prisma.judgeInvite.create({
          data: {
            contestId,
            judgeId,
            status: 'PENDING'
          },
          include: {
            contest: {
              select: {
                id: true,
                title: true,
                description: true,
                coverMediaUrl: true,
                prizeTotalKr: true,
                deadline: true,
                creator: {
                  select: {
                    username: true,
                    displayName: true
                  }
                }
              }
            }
          }
        });

        results.accepted.push({
          id: invite.id,
          contestId: invite.contestId,
          judgeId: invite.judgeId,
          status: invite.status,
          invitedAt: invite.invitedAt.toISOString(),
          respondedAt: invite.respondedAt?.toISOString() || null,
          contest: {
            id: invite.contest.id,
            title: invite.contest.title,
            description: invite.contest.description,
            coverMediaUrl: invite.contest.coverMediaUrl,
            creatorUsername: invite.contest.creator.username,
            creatorDisplayName: invite.contest.creator.displayName,
            deadline: invite.contest.deadline.toISOString(),
            prizeTotalKr: Number(invite.contest.prizeTotalKr)
          }
        });

        // Send notification to judge
        NotificationService.sendJudgeInvite(judgeId, contestId, invite.id).catch(err => {
          console.error('Failed to send judge invite notification:', err);
        });
      } catch (error) {
        results.failed.push(judgeId);
      }
    }

    return results;
  }

  /**
   * Get judge invitations for a user
   * Returns pending invitations with contest details
   */
  static async getJudgeInvitations(userId: string) {
    const invites = await prisma.judgeInvite.findMany({
      where: {
        judgeId: userId,
        status: 'PENDING'
      },
      include: {
        contest: {
          select: {
            id: true,
            title: true,
            description: true,
            coverMediaUrl: true,
            prizeTotalKr: true,
            deadline: true,
            creator: {
              select: {
                username: true,
                displayName: true
                  }
            }
          }
        }
      },
      orderBy: { invitedAt: 'desc' }
    });

    return invites.map((invite) => ({
      id: invite.id,
      contestId: invite.contestId,
      judgeId: invite.judgeId,
      status: invite.status,
      invitedAt: invite.invitedAt.toISOString(),
      respondedAt: invite.respondedAt?.toISOString() || null,
      contest: {
        id: invite.contest.id,
        title: invite.contest.title,
        description: invite.contest.description,
        coverMediaUrl: invite.contest.coverMediaUrl,
        creatorUsername: invite.contest.creator.username,
        creatorDisplayName: invite.contest.creator.displayName,
        deadline: invite.contest.deadline.toISOString(),
        prizeTotalKr: Number(invite.contest.prizeTotalKr)
      }
    }));
  }

  /**
   * Accept a judge invitation
   * Updates invite status and grants judge access
   */
  static async acceptJudgeInvite(inviteId: string, userId: string) {
    const invite = await prisma.judgeInvite.findUniqueOrThrow({
      where: { id: inviteId }
    });

    if (invite.judgeId !== userId) {
      throw new Error('Unauthorized');
    }

    if (invite.status !== 'PENDING') {
      throw new Error('Invitation already responded to');
    }

    await prisma.judgeInvite.update({
      where: { id: inviteId },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date()
      }
    });

    // Send notification to contest creator
    NotificationService.notifyJudgeAccepted(invite.contestId, userId).catch(err => {
      console.error('Failed to send judge accepted notification:', err);
    });

    return { success: true };
  }

  /**
   * Decline a judge invitation
   */
  static async declineJudgeInvite(inviteId: string, userId: string) {
    const invite = await prisma.judgeInvite.findUniqueOrThrow({
      where: { id: inviteId }
    });

    if (invite.judgeId !== userId) {
      throw new Error('Unauthorized');
    }

    if (invite.status !== 'PENDING') {
      throw new Error('Invitation already responded to');
    }

    await prisma.judgeInvite.update({
      where: { id: inviteId },
      data: {
        status: 'DECLINED',
        respondedAt: new Date()
      }
    });

    // Send notification to contest creator
    NotificationService.notifyJudgeDeclined(invite.contestId, userId).catch(err => {
      console.error('Failed to send judge declined notification:', err);
    });

    return { success: true };
  }

  /**
   * Get contests assigned to a judge
   * Returns contests where judge has accepted the invitation
   */
  static async getAssignedContests(judgeId: string) {
    const invites = await prisma.judgeInvite.findMany({
      where: {
        judgeId,
        status: 'ACCEPTED'
      },
      include: {
        contest: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: { invitedAt: 'desc' }
    });

    return invites.map((invite) => ({
      id: invite.contest.id,
      creator: invite.contest.creator,
      title: invite.contest.title,
      description: invite.contest.description,
      mediaType: invite.contest.mediaType,
      contestCategory: invite.contest.category,
      prizeTotalKr: Number(invite.contest.prizeTotalKr),
      platformFeeKr: Number(invite.contest.platformFeeKr),
      totalChargedKr: Number(invite.contest.prizeTotalKr) + Number(invite.contest.platformFeeKr),
      maxWinners: invite.contest.maxWinners,
      judgingCriteria: invite.contest.judgingCriteria,
      sponsorName: invite.contest.sponsorName,
      sponsorUrl: invite.contest.sponsorUrl,
      deadline: invite.contest.deadline.toISOString(),
      coverMediaUrl: invite.contest.coverMediaUrl,
      status: invite.contest.status,
      totalParticipants: invite.contest.totalParticipants,
      submissionsCount: invite.contest.totalSubmissions,
      createdAt: invite.contest.createdAt.toISOString()
    }));
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
        prizeTotalKr: Number(c.prizeTotalKr),
        platformFeeKr: Number(c.platformFeeKr),
        totalChargedKr: Number(c.prizeTotalKr) + Number(c.platformFeeKr),
        maxWinners: c.maxWinners,
        judgingCriteria: c.judgingCriteria,
        sponsorName: c.sponsorName,
        sponsorUrl: c.sponsorUrl,
        deadline: c.deadline.toISOString(),
        coverMediaUrl: c.coverMediaUrl,
        status: c.status,
        totalParticipants: c.totalParticipants,
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
      prizeTotalKr: Number(contest.prizeTotalKr),
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
      totalParticipants: contest.totalParticipants,
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

  static async getContestRequirements(userId: string, contestId: string) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: contestId },
      include: { actions: { orderBy: { sortOrder: 'asc' } } }
    });

    const hasSubmitted = !!(await prisma.contestSubmission.findUnique({
      where: { contestId_userId: { contestId, userId } }
    }));

    const hasJoined = !!(await prisma.contestParticipant.findUnique({
      where: { contestId_userId: { contestId, userId } }
    }));

    return {
      actions: contest.actions.map((a: any) => ({
        id: a.id,
        actionType: a.actionType,
        targetUrl: a.targetUrl,
        label: a.label,
        isVerifiable: a.isVerifiable,
        requiresUpload: a.requiresUpload,
        sortOrder: a.sortOrder
      })),
      hasSubmitted,
      canSubmit: hasJoined && !hasSubmitted && contest.status === 'ACTIVE'
    };
  }

  static async submitEntry(data: {
    userId: string;
    contestId: string;
    mediaUrl: string;
    mediaType: string;
    aspectRatio?: number;
    mediaUrls?: string[];
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
          aspectRatio: data.aspectRatio,
          mediaUrls: data.mediaUrls || [],
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
      aspectRatio: submission.aspectRatio,
      mediaUrls: submission.mediaUrls,
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
        aspectRatio: s.aspectRatio,
        mediaUrls: s.mediaUrls,
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
      aspectRatio: s.aspectRatio,
      mediaUrls: s.mediaUrls,
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
          prizeTotalKr: Number(s.contest.prizeTotalKr),
          status: s.contest.status
        },
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        aspectRatio: s.aspectRatio,
        mediaUrls: s.mediaUrls,
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
          submissionId,
          ipAddress: '',
          fingerprint: ''
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
            prizeTotalKr: prizeAmount
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
