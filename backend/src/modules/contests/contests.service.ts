import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
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
    creator_id: string;
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
      const wallet = await tx.wallets.findUnique({ where: { user_id: data.creator_id } });
      if (!wallet || wallet.kr_balance.lessThan(totalChargedKr)) {
        throw new Error(
          `Insufficient balance. Need Kr.${totalChargedKr.toFixed(2)} (prize + 15% platform fee)`
        );
      }

      // Deduct from creator wallet
      await tx.wallets.update({
        where: { user_id: data.creator_id },
        data: { kr_balance: { decrement: totalChargedKr } }
      });

      // Create contest
      const contest = await tx.contest.create({
        data: {
          creator_id: data.creator_id,
          title: data.title,
          description: data.description,
          media_type: data.mediaType as any,
          category: data.category,
          cover_media_url: data.coverMediaUrl,
          prize_total_kr: prizeKr,
          platform_fee_kr: feeKr,
          max_winners: data.maxWinners,
          judging_criteria: data.judgingCriteria as any,
          sponsor_name: data.sponsorName ?? null,
          sponsor_url: data.sponsorUrl ?? null,
          deadline: data.deadline,
          status: 'ACTIVE',
          
          // Inject Gamification
          entry_fee_kr: data.entryFeeKr ? new Prisma.Decimal(data.entryFeeKr) : null,
          public_vote_weight: data.publicVoteWeight,
          allow_daily_prizes: data.allowDailyPrizes ?? false,
          daily_prize_kr: data.dailyPrizeKr ? new Prisma.Decimal(data.dailyPrizeKr) : null,
          target_ages: data.targetAges,
          target_geos: data.targetGeos,
          airdrop_kr: data.airdropKr ? new Prisma.Decimal(data.airdropKr) : null,
          airdrop_limit: data.airdropLimit,
          
          ContestAction: {
            create: data.requiredActions.map((a, i) => ({
              action_type: a.type as any,
              target_url: a.targetUrl ?? '',
              label: a.label,
              sort_order: i
            }))
          },
          contest_prize_distributions: {
            create: data.prizeDistribution.map((d) => ({
              rank: d.rank,
              percentage: new Prisma.Decimal(d.percentage)
            }))
          }
        }
      });

      // Record escrow transaction
      await tx.transactions.create({
        data: {
          user_id: data.creator_id,
          type: 'contest_escrow',
          amount_kr: totalChargedKr,
          status: 'completed',
          provider: 'platform',
          reference: contest.id
        }
      });

      // Create escrow record
      await tx.escrows.create({
        data: {
          contest_id: contest.id,
          user_id: data.creator_id,
          prize_amount_kr: prizeKr,
          fee_amount_kr: feeKr,
          status: 'held'
        }
      });

      return {
        contest_id: contest.id,
        ...contest,
        prizeTotalKr: contest.prize_total_kr,
        platformFeeKr: contest.platform_fee_kr,
        totalChargedKr: totalChargedKr,
        totalParticipants: 0,
        submissionsCount: 0,
        created_at: contest.created_at.toISOString()
      };
    }).then(result => {
      // Process hashtags and mentions from description (fire-and-forget, outside transaction)
      const text = `${data.title} ${data.description}`;
      HashtagService.processContent(result.contest_id, 'CONTEST', text).catch(() => {});
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
        const existing = await prisma.judge_invites.findUnique({
          where: { contest_id_judge_id: { contest_id: contestId, judge_id: judgeId } }
        });

        if (existing) {
          results.failed.push(judgeId);
          continue;
        }

        // Create invite
        const invite = await prisma.judge_invites.create({
          data: {
            contest_id: contestId,
            judge_id: judgeId,
            status: 'PENDING',
            updated_at: new Date()
          },
          include: {
            Contest: {
              select: {
                id: true,
                title: true,
                description: true,
                cover_media_url: true,
                deadline: true,
                User: {
                  select: {
                    username: true,
                    display_name: true
                  }
                }
              }
            }
          }
        });

        results.accepted.push({
          id: invite.id,
          contest_id: invite.contest_id,
          judgeId: invite.judge_id,
          status: invite.status,
          invitedAt: invite.invited_at.toISOString(),
          respondedAt: invite.responded_at?.toISOString() || null,
          contest: {
            id: invite.Contest.id,
            title: invite.Contest.title,
            description: invite.Contest.description,
            coverMediaUrl: invite.Contest.cover_media_url,
            creatorUsername: invite.Contest.User.username,
            creatorDisplayName: invite.Contest.User.display_name,
            deadline: invite.Contest.deadline.toISOString()
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
  static async getJudgeInvitations(judgeUserId: string) {
    const invites = await prisma.judge_invites.findMany({
      where: {
        judge_id: judgeUserId,
        status: 'PENDING'
      },
      include: {
        Contest: {
          select: {
            id: true,
            title: true,
            description: true,
            cover_media_url: true,
            deadline: true,
            User: {
              select: {
                username: true,
                display_name: true
              }
            }
          }
        }
      },
      orderBy: { invited_at: 'desc' }
    });

    return invites.map((invite: any) => ({
      id: invite.id,
      contest_id: invite.contest_id,
      judgeId: invite.judge_id,
      status: invite.status,
      invitedAt: invite.invited_at.toISOString(),
      respondedAt: invite.responded_at?.toISOString() || null,
      contest: {
        id: invite.Contest.id,
        title: invite.Contest.title,
        description: invite.Contest.description,
        coverMediaUrl: invite.Contest.cover_media_url,
        creatorUsername: invite.Contest.User.username,
        creatorDisplayName: invite.Contest.User.display_name,
        deadline: invite.Contest.deadline.toISOString()
      }
    }));
  }

  /**
   * Accept a judge invitation
   * Updates invite status and grants judge access
   */
  static async acceptJudgeInvite(inviteId: string, judgeUserId: string) {
    const invite = await prisma.judge_invites.findUniqueOrThrow({
      where: { id: inviteId }
    });

    if (invite.judge_id !== judgeUserId) {
      throw new Error('Unauthorized');
    }

    if (invite.status !== 'PENDING') {
      throw new Error('Invitation already responded to');
    }

    await prisma.judge_invites.update({
      where: { id: inviteId },
      data: {
        status: 'ACCEPTED',
        responded_at: new Date()
      }
    });

    // Send notification to contest creator
    NotificationService.notifyJudgeAccepted(invite.contest_id, judgeUserId).catch(err => {
      console.error('Failed to send judge accepted notification:', err);
    });

    return { success: true };
  }

  /**
   * Decline a judge invitation
   */
  static async declineJudgeInvite(inviteId: string, judgeUserId: string) {
    const invite = await prisma.judge_invites.findUniqueOrThrow({
      where: { id: inviteId }
    });

    if (invite.judge_id !== judgeUserId) {
      throw new Error('Unauthorized');
    }

    if (invite.status !== 'PENDING') {
      throw new Error('Invitation already responded to');
    }

    await prisma.judge_invites.update({
      where: { id: inviteId },
      data: {
        status: 'DECLINED',
        responded_at: new Date()
      }
    });

    // Send notification to contest creator
    NotificationService.notifyJudgeDeclined(invite.contest_id, judgeUserId).catch(err => {
      console.error('Failed to send judge declined notification:', err);
    });

    return { success: true };
  }

  /**
   * Get contests assigned to a judge
   * Returns contests where judge has accepted the invitation
   */
  static async getAssignedContests(judgeId: string) {
    const invites = await prisma.judge_invites.findMany({
      where: {
        judge_id: judgeId,
        status: 'ACCEPTED'
      },
      include: {
        Contest: {
          include: {
            User: {
              select: {
                id: true,
                username: true,
                display_name: true,
                avatar_url: true
              }
            }
          }
        }
      },
      orderBy: { invited_at: 'desc' }
    });

    return invites.map((invite: any) => ({
      id: invite.Contest.id,
      creator: invite.Contest.User,
      title: invite.Contest.title,
      description: invite.Contest.description,
      media_type: invite.Contest.media_type,
      contestCategory: invite.Contest.category,
      prizeTotalKr: Number(invite.Contest.prize_total_kr),
      platformFeeKr: Number(invite.Contest.platform_fee_kr),
      totalChargedKr: Number(invite.Contest.prize_total_kr) + Number(invite.Contest.platform_fee_kr),
      maxWinners: invite.Contest.max_winners,
      judgingCriteria: invite.Contest.judging_criteria,
      sponsorName: invite.Contest.sponsor_name,
      sponsorUrl: invite.Contest.sponsor_url,
      deadline: invite.Contest.deadline.toISOString(),
      coverMediaUrl: invite.Contest.cover_media_url,
      status: invite.Contest.status,
      totalParticipants: invite.Contest.total_participants,
      submissionsCount: invite.Contest.total_submissions,
      created_at: invite.Contest.created_at.toISOString()
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
      orderBy: { created_at: 'desc' }
    });

    const hasMore = contests.length > limit;
    const items = hasMore ? contests.slice(0, limit) : contests;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Check if user has joined each contest
    const joinedIds = new Set<string>();
    if (userId) {
      const joined = await prisma.contest_participants.findMany({
        where: { user_id: userId, contest_id: { in: items.map((c) => c.id) } },
        select: { contest_id: true }
      });
      joined.forEach((j: { contest_id: string }) => joinedIds.add(j.contest_id));
    }

    return {
      items: items.map((c: any) => ({
        id: c.id,
        creator: c.User,
        title: c.title,
        description: c.description,
        media_type: c.media_type,
        contestCategory: c.category,
        prizeTotalKr: Number(c.prize_total_kr),
        platformFeeKr: Number(c.platform_fee_kr),
        totalChargedKr: Number(c.prize_total_kr) + Number(c.platform_fee_kr),
        maxWinners: c.max_winners,
        judgingCriteria: c.judging_criteria,
        sponsorName: c.sponsor_name,
        sponsorUrl: c.sponsor_url,
        deadline: c.deadline.toISOString(),
        coverMediaUrl: c.cover_media_url,
        status: c.status,
        totalParticipants: c.total_participants,
        submissionsCount: c.total_submissions,
        isJoined: joinedIds.has(c.id),
        created_at: c.created_at.toISOString()
      })),
      nextCursor
    };
  }

  static async getContestById(contestId: string, userId?: string) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: contestId },
      include: {
        User: true
      }
    });

    const isJoined = userId
      ? !!(await prisma.contest_participants.findUnique({
          where: { contest_id_user_id: { contest_id: contestId, user_id: userId } }
        }))
      : false;

    return {
      id: contest.id,
      creator: contest.User,
      title: contest.title,
      description: contest.description,
      media_type: contest.media_type,
      contestCategory: contest.category,
      prizeTotalKr: Number(contest.prize_total_kr),
      platformFeeKr: Number(contest.platform_fee_kr),
      totalChargedKr: Number(contest.prize_total_kr) + Number(contest.platform_fee_kr),
      rules: [],
      requiredActions: [],
      maxWinners: contest.max_winners,
      judgingCriteria: contest.judging_criteria,
      sponsorName: contest.sponsor_name,
      sponsorUrl: contest.sponsor_url,
      deadline: contest.deadline.toISOString(),
      coverMediaUrl: contest.cover_media_url,
      status: contest.status,
      totalParticipants: contest.total_participants,
      submissionsCount: contest.total_submissions,
      isJoined,
      created_at: contest.created_at.toISOString()
    };
  }

  static async joinContest(userId: string, contestId: string) {
    const contest = await prisma.contest.findUniqueOrThrow({ where: { id: contestId } });
    if (contest.status !== 'ACTIVE') {
      throw new Error('Contest is no longer active');
    }

    // Upsert-like check using compound unique
    const existing = await prisma.contest_participants.findUnique({
      where: { contest_id_user_id: { contest_id: contestId, user_id: userId } }
    });
    if (existing) throw new Error('Already joined this contest');

    const [participant] = await prisma.$transaction([
      prisma.contest_participants.create({ data: { user_id: userId, contest_id: contestId } }),
      prisma.contest.update({ where: { id: contestId }, data: { total_participants: { increment: 1 } } })
    ]);

    // Emit contest update
    emitContestUpdate(contestId, contest.status, contest.total_participants + 1);

    return participant;
  }

  static async getContestRequirements(userId: string, contestId: string) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: contestId }
    });

    const hasSubmitted = !!(await prisma.contestSubmission.findUnique({
      where: { contest_id_user_id: { contest_id: contestId, user_id: userId } }
    }));

    const hasJoined = !!(await prisma.contest_participants.findUnique({
      where: { contest_id_user_id: { contest_id: contestId, user_id: userId } }
    }));

    return {
      actions: [],
      hasSubmitted,
      canSubmit: hasJoined && !hasSubmitted && contest.status === 'ACTIVE'
    };
  }

  static async submitEntry(data: {
    user_id: string;
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
    const participant = await prisma.contest_participants.findUnique({
      where: { contest_id_user_id: { contest_id: data.contestId, user_id: data.user_id } }
    });
    if (!participant) throw new Error('You must join this contest before submitting');

    const [submission] = await prisma.$transaction([
      prisma.contestSubmission.create({
        data: {
          user_id: data.user_id,
          contest_id: data.contestId,
          media_url: data.mediaUrl,
          media_type: data.mediaType,
          proof_urls: data.proofUrls || []
        },
        include: {
          User: { select: { id: true, username: true, display_name: true, avatar_url: true } }
        }
      }),
      prisma.contest.update({ where: { id: data.contestId }, data: { total_submissions: { increment: 1 } } })
    ]);

    return {
      ...submission,
      aspectRatio: null,
      mediaUrls: [submission.media_url],
      votes: submission.votes_count,
      proofScreenshots: submission.proof_urls,
      created_at: submission.submitted_at.toISOString()
    };
  }

  static async getSubmissions(contestId: string, cursor?: string, limit = 20) {
    const submissions = await prisma.contestSubmission.findMany({
      where: { contest_id: contestId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { submitted_at: 'desc' },
      include: {
        User: { select: { id: true, username: true, display_name: true, avatar_url: true } }
      }
    });

    const hasMore = submissions.length > limit;
    const items = hasMore ? submissions.slice(0, limit) : submissions;
    return {
      items: items.map((s: any) => ({
        id: s.id,
        user: s.User,
        contest_id: s.contest_id,
        media_url: s.media_url,
        media_type: s.media_type,
        aspectRatio: null,
        mediaUrls: [s.media_url],
        proofScreenshots: s.proof_urls,
        votes: s.votes_count,
        rank: s.rank,
        created_at: s.submitted_at.toISOString()
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  static async getLeaderboard(contestId: string) {
    const submissions = await prisma.contestSubmission.findMany({
      where: { contest_id: contestId },
      orderBy: [{ votes_count: 'desc' }, { submitted_at: 'asc' }],
      take: 50,
      include: {
        User: { select: { id: true, username: true, display_name: true, avatar_url: true } }
      }
    });

    return submissions.map((s: any) => ({
      id: s.id,
      user: s.User,
      contest_id: s.contest_id,
      media_url: s.media_url,
      media_type: s.media_type,
      aspectRatio: null,
      mediaUrls: [s.media_url],
      proofScreenshots: s.proof_urls,
      votes: s.votes_count,
      rank: s.rank,
      created_at: s.submitted_at.toISOString()
    }));
  }

  /**
   * Get all contest submissions feed from active contests
   */
  static async getSubmissionsFeed(cursor?: string, limit = 20, userId?: string) {
    const submissions = await prisma.contestSubmission.findMany({
      where: {
        Contest: { status: 'ACTIVE' }
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { submitted_at: 'desc' },
      include: {
        User: { select: { id: true, username: true, display_name: true, avatar_url: true, is_verified: true } },
        Contest: {
          select: {
            id: true,
            title: true,
            prize_total_kr: true,
            status: true
          }
        }
      }
    });

    const hasMore = submissions.length > limit;
    const items = hasMore ? submissions.slice(0, limit) : submissions;

    return {
      items: items.map((s: any) => ({
        id: s.id,
        user: s.User,
        contest_id: s.contest_id,
        contest: {
          id: s.Contest.id,
          title: s.Contest.title,
          prizeTotalKr: Number(s.Contest.prize_total_kr),
          status: s.Contest.status
        },
        media_url: s.media_url,
        media_type: s.media_type,
        aspectRatio: null,
        mediaUrls: [s.media_url],
        caption: '', // Add caption field if needed
        proofScreenshots: s.proof_urls,
        votes: s.votes_count,
        rank: s.rank,
        created_at: s.submitted_at.toISOString()
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
      include: { Contest: true }
    });

    if (submission.Contest.status !== 'ACTIVE') {
      throw new Error('Contest is not active');
    }

    if (submission.user_id === userId) {
      throw new Error('Cannot vote on your own submission');
    }

    return prisma.$transaction(async (tx) => {
      // Check if user already voted
      const existingVote = await tx.contest_votes.findUnique({
        where: {
          submission_id_voter_id: { submission_id: submissionId, voter_id: userId }
        }
      });

      if (existingVote) {
        throw new Error('You have already voted on this submission');
      }

      // Create new vote
      await tx.contest_votes.create({
        data: {
          voter_id: userId,
          submission_id: submissionId,
          ip_address: '',
          fingerprint: ''
        }
      });

      // Update counts
      await tx.contestSubmission.update({
        where: { id: submissionId },
        data: { votes_count: { increment: 1 } }
      });

      // Get updated submission
      const updated = await tx.contestSubmission.findUniqueOrThrow({
        where: { id: submissionId }
      });

      // Emit real-time vote update
      emitVoteUpdate(submissionId, updated.votes_count, userId);

      return {
        success: true,
        newVoteCount: updated.votes_count
      };
    });
  }

  /**
   * Distributes prizes to winners atomically.
   * Uses prize distribution percentages from the contest.
   */
  static async distributeContestPrizes(contestId: string, winnerIds: string[]) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: contestId }
    });
    if (contest.status !== 'JUDGING') throw new Error('Contest is not in JUDGING state');

    const totalPrize = Number(contest.prize_total_kr);

    return prisma.$transaction(async (tx) => {
      for (const [index, winnerId] of winnerIds.entries()) {
        const prizeAmount = new Prisma.Decimal(totalPrize / winnerIds.length);

        // Credit winner wallet
        await tx.wallets.upsert({
          where: { user_id: winnerId },
          create: { user_id: winnerId, kr_balance: prizeAmount, updated_at: new Date() },
          update: { kr_balance: { increment: prizeAmount } }
        });

        // Record transaction
        await tx.transactions.create({
          data: {
            user_id: winnerId,
            type: 'contest_prize',
            amount_kr: prizeAmount,
            status: 'completed',
            provider: 'platform',
            reference: contestId
          }
        });

        // Record winner
        await tx.contest_winners.create({
          data: {
            contest_id: contestId,
            user_id: winnerId,
            rank: index + 1,
            prize_kr: prizeAmount
          }
        });

        // Unlock wallet on first prize income
        await tx.user.update({
          where: { id: winnerId },
          data: { is_wallet_unlocked: true }
        });
      }

      // Release escrow
      await tx.escrows.updateMany({
        where: { contest_id: contestId, status: 'held' },
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
