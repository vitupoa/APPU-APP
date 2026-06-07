import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { emitVoteUpdate, emitContestUpdate } from '../../shared/gateway/events.js';
import { HashtagService } from '../../shared/hashtag.service.js';
import { NotificationService } from '../../shared/services/notification.service.js';
import { contestValidationService } from '../../services/compliance/contestValidation.service.js';
import crypto from 'crypto';

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
    dailyprizeTotalKr?: number;
    targetAges?: number[];
    targetGeos?: string[];
    airdropKr?: number;
    airdropLimit?: number;
    judges?: string[];
    votingEnabled?: boolean;
    votingCostPerVoteKr?: number;
    judgingMethod?: string;
    judgeWeightPercentage?: number;
    voteWeightPercentage?: number;
    
    // Team Participation Fields
    participationType?: 'INDIVIDUAL_ONLY' | 'TEAM_ONLY' | 'BOTH';
    teamSize?: number;
    maxTeams?: number;
  }) {
    // Wave 2 Task 8.2: Validate contest structure for gambling compliance
    const validation = await contestValidationService.validateContestCreation({
      entry_fee_kr: data.entryFeeKr || 0,
      voting_enabled: data.votingEnabled !== false,
      voting_cost_per_vote_kr: data.votingCostPerVoteKr || 0,
      judging_method: data.judgingMethod as any,
      judge_weight_percentage: data.judgeWeightPercentage,
      vote_weight_percentage: data.voteWeightPercentage,
      max_judges: data.judges?.length,
      prize_total_kr: data.prizeTotalKr,
      deadline: data.deadline,
      max_winners: data.maxWinners
    });

    if (!validation.isValid) {
      throw new Error(`Contest validation failed: ${validation.errors.join(', ')}`);
    }

    const platformFeeKr = data.prizeTotalKr * PLATFORM_FEE_RATE;
    
    // Calculate total duration in days dynamically locking the daily prize pool Escrow natively
    const durationMs = data.deadline.getTime() - new Date().getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    
    const totalDailyPrizePool = data.allowDailyPrizes && data.dailyPrizeKr ? (data.dailyPrizeKr * durationDays) : 0;
    const dailyPrizePlatformFee = totalDailyPrizePool * PLATFORM_FEE_RATE;
    
    const airdropTotalPool = (data.airdropKr && data.airdropLimit) ? (data.airdropKr * data.airdropLimit) : 0;
    const airdropPlatformFee = airdropTotalPool * PLATFORM_FEE_RATE;
    
    // Massive Escrow Calculation blocking fraudulent contest creations natively 
    // Creator pays: prize + 15% fee + daily prizes + 15% fee + airdrops + 15% fee
    const totalChargedKr = new Prisma.Decimal(
      data.prizeTotalKr + platformFeeKr + 
      totalDailyPrizePool + dailyPrizePlatformFee + 
      airdropTotalPool + airdropPlatformFee
    );
    const prizeKr = new Prisma.Decimal(data.prizeTotalKr);
    const feeKr = new Prisma.Decimal(platformFeeKr + dailyPrizePlatformFee + airdropPlatformFee);

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
          include: { contest: {
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
            id: invite.contest.id,
            title: invite.contest.title,
            description: invite.contest.description,
            coverMediaUrl: invite.contest.cover_media_url,
            creatorUsername: invite.contest.user.username,
            creatorDisplayName: invite.contest.user.display_name,
            deadline: invite.contest.deadline.toISOString()
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
      include: { contest: {
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
        id: invite.contest.id,
        title: invite.contest.title,
        description: invite.contest.description,
        coverMediaUrl: invite.contest.cover_media_url,
        creatorUsername: invite.contest.user.username,
        creatorDisplayName: invite.contest.user.display_name,
        deadline: invite.contest.deadline.toISOString()
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
      include: { contest: {
          include: { user: {
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
      id: invite.contest.id,
      creator: invite.contest.user,
      title: invite.contest.title,
      description: invite.contest.description,
      media_type: invite.contest.media_type,
      contestCategory: invite.contest.category,
      prizeTotalKr: Number(invite.contest.prize_total_kr),
      platformFeeKr: Number(invite.contest.platform_fee_kr),
      totalChargedKr: Number(invite.contest.prize_total_kr) + Number(invite.contest.platform_fee_kr),
      maxWinners: invite.contest.max_winners,
      judgingCriteria: invite.contest.judging_criteria,
      sponsorName: invite.contest.sponsor_name,
      sponsorUrl: invite.contest.sponsor_url,
      deadline: invite.contest.deadline.toISOString(),
      coverMediaUrl: invite.contest.cover_media_url,
      status: invite.contest.status,
      totalParticipants: invite.contest.total_participants,
      submissionsCount: invite.contest.total_submissions,
      created_at: invite.contest.created_at.toISOString()
    }));
  }

  static async listContests(params: {
    status?: string;
    cursor?: string;
    limit: number;
    userId?: string;
    userCurrency?: string;
  }) {
    const { status, cursor, limit, userId, userCurrency } = params;

    const contests = await prisma.contest.findMany({
      where: status ? { status: status as any } : undefined,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { created_at: 'desc' },
      include: {
        contest_prize_distributions: {
          orderBy: { rank: 'asc' }
        }
      }
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

    // Get exchange rate if currency provided
    let krToLocalRate = 1;
    if (userCurrency) {
      try {
        const { ExchangeService } = await import('../../services/exchange/exchange.service.js');
        const krToUsd = ExchangeService.getUSDFromKr(1);
        const usdToLocalRate = await ExchangeService.getRate(userCurrency);
        krToLocalRate = krToUsd * usdToLocalRate;
      } catch (error) {
        // Fallback to 1:1 if conversion fails
        krToLocalRate = 1;
      }
    }

    return {
      items: items.map((c: any) => {
        const prizeTotalKr = Number(c.prize_total_kr);
        const prizeTotalFiat = userCurrency ? prizeTotalKr * krToLocalRate : null;

        return {
          id: c.id,
          creator: c.user,
          title: c.title,
          description: c.description,
          media_type: c.media_type,
          contestCategory: c.category,
          prizeTotalKr,
          prizeTotalFiat,
          currency: userCurrency?.toUpperCase(),
          platformFeeKr: Number(c.platform_fee_kr),
          totalChargedKr: Number(c.prize_total_kr) + Number(c.platform_fee_kr),
          maxWinners: c.max_winners,
          judgingCriteria: c.judging_criteria,
          publicVoteWeight: c.public_vote_weight,
          sponsorName: c.sponsor_name,
          sponsorUrl: c.sponsor_url,
          deadline: c.deadline.toISOString(),
          coverMediaUrl: c.cover_media_url,
          status: c.status,
          totalParticipants: c.total_participants,
          submissionsCount: c.total_submissions,
          isJoined: joinedIds.has(c.id),
          created_at: c.created_at.toISOString()
        };
      }),
      nextCursor
    };
  }

  static async getContestById(contestId: string, userId?: string, userCurrency?: string) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: contestId },
      include: { user: true,
        contest_prize_distributions: {
          orderBy: { rank: 'asc' }
        }
      }
    });

    const isJoined = userId
      ? !!(await prisma.contest_participants.findUnique({
          where: { contest_id_user_id: { contest_id: contestId, user_id: userId } }
        }))
      : false;

    // Get prize breakdown with currency conversion if currency provided
    let prizeBreakdown = null;
    if (userCurrency) {
      try {
        prizeBreakdown = await this.getPrizeBreakdown(contestId, userCurrency);
      } catch (error) {
        // Fallback to just Kr amounts if conversion fails
        prizeBreakdown = null;
      }
    }

    return {
      id: contest.id,
      creator: contest.user,
      title: contest.title,
      description: contest.description,
      media_type: contest.media_type,
      contestCategory: contest.category,
      prizeTotalKr: Number(contest.prize_total_kr),
      platformFeeKr: Number(contest.platform_fee_kr),
      totalChargedKr: Number(contest.prize_total_kr) + Number(contest.platform_fee_kr),
      prizeBreakdown,
      prizeDistributions: contest.contest_prize_distributions.map(d => ({
        rank: d.rank,
        percentage: Number(d.percentage)
      })),
      rules: [],
      requiredActions: [],
      maxWinners: contest.max_winners,
      judgingCriteria: contest.judging_criteria,
      publicVoteWeight: contest.public_vote_weight,
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
      prisma.contest_participants.create({ data: { user_id: userId, contest_id: contestId }} as any)),
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

    const hasSubmitted = !!(await prisma.contest_submission.findUnique({
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
      prisma.contest_submission.create({
        data: {
          user_id: data.user_id,
          contest_id: data.contestId,
          media_url: data.mediaUrl,
          media_type: data.mediaType,
          proof_urls: data.proofUrls || []
        },
        include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } }
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
    const submissions = await prisma.contest_submission.findMany({
      where: { contest_id: contestId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { submitted_at: 'desc' },
      include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } }
      }
    });

    const hasMore = submissions.length > limit;
    const items = hasMore ? submissions.slice(0, limit) : submissions;
    return {
      items: items.map((s: any) => ({
        id: s.id,
        user: s.user,
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
    const submissions = await prisma.contest_submission.findMany({
      where: { contest_id: contestId },
      orderBy: [{ votes_count: 'desc' }, { submitted_at: 'asc' }],
      take: 50,
      include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } }
      }
    });

    return submissions.map((s: any) => ({
      id: s.id,
      user: s.user,
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
    const submissions = await prisma.contest_submission.findMany({
      where: {
        Contest: { status: 'ACTIVE' }
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { submitted_at: 'desc' },
      include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true, is_verified: true } },
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
        user: s.user,
        contest_id: s.contest_id,
        contest: {
          id: s.contest.id,
          title: s.contest.title,
          prizeTotalKr: Number(s.contest.prize_total_kr),
          status: s.contest.status
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
    const submission = await prisma.contest_submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { contest: true }
    });

    if (submission.contest.status !== 'ACTIVE') {
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
   * Transition contest from ACTIVE to JUDGING status
   * Called when deadline passes or manually by creator
   */
  static async transitionToJudging(contestId: string, creatorId?: string) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: contestId }
    });

    // Verify creator if provided
    if (creatorId && contest.creator_id !== creatorId) {
      throw new Error('Only contest creator can manually transition to judging');
    }

    if (contest.status !== 'ACTIVE') {
      throw new Error('Contest must be ACTIVE to transition to JUDGING');
    }

    // Check if deadline has passed or creator is manually transitioning
    const now = new Date();
    if (creatorId && contest.deadline > now) {
      // Allow creator to manually transition before deadline
    } else if (contest.deadline > now) {
      throw new Error('Contest deadline has not passed yet');
    }

    await prisma.contest.update({
      where: { id: contestId },
      data: { status: 'JUDGING' }
    });

    return { success: true, message: 'Contest transitioned to JUDGING status' };
  }

  /**
   * Judge scores a submission
   * Only judges assigned to the contest can score
   */
  static async scoreSubmission(judgeUserId: string, submissionId: string, score: number, feedback?: string) {
    const submission = await prisma.contest_submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { contest: true }
    });

    // Verify judge is assigned to this contest
    const judgeAssignment = await prisma.judge_invites.findUnique({
      where: {
        contest_id_judge_id: {
          contest_id: submission.contest_id,
          judge_id: judgeUserId
        }
      }
    });

    if (!judgeAssignment || judgeAssignment.status !== 'ACCEPTED') {
      throw new Error('You are not authorized to judge this contest');
    }

    if (submission.contest.status !== 'JUDGING') {
      throw new Error('Contest must be in JUDGING status to score submissions');
    }

    if (score < 0 || score > 100) {
      throw new Error('Score must be between 0 and 100');
    }

    // Get or create judge record
    const judge = await prisma.contest_judges.upsert({
      where: {
        contest_id_user_id: {
          contest_id: submission.contest_id,
          user_id: judgeUserId
        }
      },
      create: {
        contest_id: submission.contest_id,
        user_id: judgeUserId,
        status: 'active'
      },
      update: {}
    });

    // Upsert judge score
    const judgeScore = await prisma.judge_scores.upsert({
      where: {
        judge_id_submission_id: {
          judge_id: judge.id,
          submission_id: submissionId
        }
      },
      create: {
        judge_id: judge.id,
        submission_id: submissionId,
        score: new Prisma.Decimal(score),
        feedback
      },
      update: {
        score: new Prisma.Decimal(score),
        feedback,
        updated_at: new Date()
      }
    });

    // Recalculate average judge score for this submission
    await this.recalculateSubmissionScores(submissionId);

    return judgeScore;
  }

  /**
   * Recalculate judge_score and final_score for a submission
   */
  static async recalculateSubmissionScores(submissionId: string) {
    const submission = await prisma.contest_submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { contest: true,
        judge_scores: true
      }
    });

    // Calculate average judge score
    let avgJudgeScore = new Prisma.Decimal(0);
    if (submission.judge_scores.length > 0) {
      const totalScore = submission.judge_scores.reduce(
        (sum, js) => sum + Number(js.score),
        0
      );
      avgJudgeScore = new Prisma.Decimal(totalScore / submission.judge_scores.length);
    }

    // Calculate final score based on judging criteria
    let finalScore = new Prisma.Decimal(0);
    const contest = submission.contest;

    switch (contest.judging_criteria) {
      case 'CREATOR_PICKS':
        // Final score is just judge score (creator is the judge)
        finalScore = avgJudgeScore;
        break;

      case 'COMMUNITY_VOTE':
        // Final score is just vote count
        finalScore = new Prisma.Decimal(submission.votes_count);
        break;

      case 'MOST_ENGAGEMENT':
        // Final score is vote count (can be extended to include comments, shares, etc.)
        finalScore = new Prisma.Decimal(submission.votes_count);
        break;

      case 'COMBINATION':
        // Weighted combination of judge score and public votes
        const judgeWeight = 100 - (contest.public_vote_weight || 50);
        const publicWeight = contest.public_vote_weight || 50;
        
        // Normalize votes to 0-100 scale (assuming max 1000 votes)
        const normalizedVotes = Math.min(submission.votes_count / 10, 100);
        
        finalScore = new Prisma.Decimal(
          (Number(avgJudgeScore) * judgeWeight / 100) +
          (normalizedVotes * publicWeight / 100)
        );
        break;
    }

    // Update submission with new scores
    await prisma.contest_submission.update({
      where: { id: submissionId },
      data: {
        judge_score: avgJudgeScore,
        final_score: finalScore
      }
    });

    return { judge_score: avgJudgeScore, final_score: finalScore };
  }

  /**
   * Calculate winners based on judging criteria and final scores
   * Returns array of winner user IDs in rank order
   */
  static async calculateWinners(contestId: string) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: contestId },
      include: {
        ContestSubmission: {
          include: { user: {
              select: {
                id: true,
                username: true,
                display_name: true
              }
            }
          }
        },
        contest_prize_distributions: {
          orderBy: { rank: 'asc' }
        }
      }
    });

    if (contest.status !== 'JUDGING') {
      throw new Error('Contest must be in JUDGING status to calculate winners');
    }

    // Recalculate all submission scores first
    for (const submission of contest.contest_submission) {
      await this.recalculateSubmissionScores(submission.id);
    }

    // Fetch updated submissions with scores
    const submissions = await prisma.contest_submission.findMany({
      where: { contest_id: contestId },
      include: { user: {
          select: {
            id: true,
            username: true,
            display_name: true
          }
        }
      },
      orderBy: [
        { final_score: 'desc' },
        { submitted_at: 'asc' } // Tiebreaker: earlier submission wins
      ],
      take: contest.max_winners
    });

    // Update ranks
    for (let i = 0; i < submissions.length; i++) {
      await prisma.contest_submission.update({
        where: { id: submissions[i].id },
        data: { rank: i + 1 }
      });
    }

    return submissions.map((s, index) => ({
      userId: s.user_id,
      rank: index + 1,
      username: s.user.username,
      displayName: s.user.display_name,
      finalScore: Number(s.final_score),
      judgeScore: Number(s.judge_score),
      votesCount: s.votes_count
    }));
  }

  /**
   * Distributes prizes to winners atomically.
   * Uses prize distribution percentages from the contest.
   * Wave 3 Task 8.3: Uses "platform-held funds" terminology (not escrow)
   */
  static async distributeContestPrizes(contestId: string, winnerIds?: string[]) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: contestId },
      include: {
        contest_prize_distributions: {
          orderBy: { rank: 'asc' }
        }
      }
    });

    if (contest.status !== 'JUDGING') {
      throw new Error('Contest is not in JUDGING state');
    }

    // If no winnerIds provided, calculate them automatically
    let winners: { userId: string; rank: number }[];
    if (!winnerIds || winnerIds.length === 0) {
      const calculatedWinners = await this.calculateWinners(contestId);
      winners = calculatedWinners.map(w => ({ userId: w.userId, rank: w.rank }));
    } else {
      // Use provided winner IDs
      winners = winnerIds.map((userId, index) => ({ userId, rank: index + 1 }));
    }

    const totalPrize = Number(contest.prize_total_kr);

    // Validate prize distribution percentages sum to 100
    const totalPercentage = contest.contest_prize_distributions.reduce(
      (sum, dist) => sum + Number(dist.percentage),
      0
    );

    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Prize distribution percentages must sum to 100%');
    }

    return prisma.$transaction(async (tx) => {
      for (const winner of winners) {
        // Find prize distribution for this rank
        const distribution = contest.contest_prize_distributions.find(
          d => d.rank === winner.rank
        );

        if (!distribution) {
          // If no specific distribution, divide equally
          const prizeAmount = new Prisma.Decimal(totalPrize / winners.length);
          await this.creditWinner(tx, winner.userId, contestId, winner.rank, prizeAmount);
        } else {
          // Use percentage distribution
          const prizeAmount = new Prisma.Decimal(
            (totalPrize * Number(distribution.percentage)) / 100
          );
          await this.creditWinner(tx, winner.userId, contestId, winner.rank, prizeAmount);
        }
      }

      // Release platform-held funds (Wave 3 Task 8.3: removed "escrow" terminology)
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

  /**
   * Helper to credit winner wallet and record transaction
   */
  private static async creditWinner(
    tx: any,
    winnerId: string,
    contestId: string,
    rank: number,
    prizeAmount: Prisma.Decimal
  ) {
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
        rank: rank,
        prize_kr: prizeAmount
      }
    });

    // Unlock wallet on first prize income
    await tx.user.update({
      where: { id: winnerId },
      data: { is_wallet_unlocked: true }
    });
  }

  /**
   * Get prize amounts with currency conversion for display
   */
  static async getPrizeBreakdown(contestId: string, userCurrency: string) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: contestId },
      include: {
        contest_prize_distributions: {
          orderBy: { rank: 'asc' }
        }
      }
    });

    const totalPrizeKr = Number(contest.prize_total_kr);
    
    // Import exchange service dynamically
    const { ExchangeService } = await import('../../services/exchange/exchange.service.js');
    
    // Get exchange rate for user's currency
    const krToUsd = ExchangeService.getUSDFromKr(1); // 1 Kr = $100 USD
    const usdToLocalRate = await ExchangeService.getRate(userCurrency);
    const krToLocalRate = krToUsd * usdToLocalRate;

    const breakdown = contest.contest_prize_distributions.map(dist => {
      const prizeKr = (totalPrizeKr * Number(dist.percentage)) / 100;
      const prizeFiat = prizeKr * krToLocalRate;

      return {
        rank: dist.rank,
        percentage: Number(dist.percentage),
        amountKr: prizeKr,
        amountFiat: prizeFiat,
        currency: userCurrency.toUpperCase()
      };
    });

    return {
      totalPrizeKr,
      totalPrizeFiat: totalPrizeKr * krToLocalRate,
      currency: userCurrency.toUpperCase(),
      breakdown
    };
  }
}
