import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

const PLATFORM_FEE_RATE = 0.15;

export class TeamsService {
  static async createTeam(data: {
    leaderId: string;
    name: string;
    avatarUrl?: string;
    maxMembers: number;
  }) {
    if (data.maxMembers < 2 || data.maxMembers > 10) {
      throw new Error('Team size must be between 2 and 10 members');
    }

    return prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: data.name,
          avatarUrl: data.avatarUrl,
          leaderId: data.leaderId,
          maxMembers: data.maxMembers,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: data.leaderId,
          role: 'LEADER',
        },
      });

      return team;
    });
  }

  static async inviteMember(teamId: string, inviterId: string, inviteeId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) throw new Error('Team not found');

    const inviterMember = team.members.find((m) => m.userId === inviterId);
    if (!inviterMember || (inviterMember.role !== 'LEADER' && inviterMember.role !== 'CO_LEADER')) {
      throw new Error('Only leaders can invite members');
    }

    if (team.members.length >= team.maxMembers) {
      throw new Error('Team is full');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return prisma.teamInvitation.create({
      data: {
        teamId,
        inviterId,
        inviteeId,
        expiresAt,
      },
    });
  }

  static async respondToInvitation(invitationId: string, userId: string, accept: boolean) {
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: { team: { include: { members: true } } },
    });

    if (!invitation) throw new Error('Invitation not found');
    if (invitation.inviteeId !== userId) throw new Error('Not authorized');
    if (invitation.status !== 'PENDING') throw new Error('Invitation already processed');
    if (new Date() > invitation.expiresAt) throw new Error('Invitation expired');

    if (accept) {
      if (invitation.team.members.length >= invitation.team.maxMembers) {
        throw new Error('Team is full');
      }

      return prisma.$transaction([
        prisma.teamInvitation.update({
          where: { id: invitationId },
          data: { status: 'ACCEPTED' },
        }),
        prisma.teamMember.create({
          data: {
            teamId: invitation.teamId,
            userId,
            role: 'MEMBER',
          },
        }),
      ]);
    } else {
      return prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'REJECTED' },
      });
    }
  }

  static async registerTeamForContest(contestId: string, teamId: string, userId: string) {
    const contest = await prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) throw new Error('Contest not found');

    if (contest.participationType === 'INDIVIDUAL_ONLY') {
      throw new Error('This contest is for individuals only');
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) throw new Error('Team not found');

    const member = team.members.find((m) => m.userId === userId);
    if (!member || member.role === 'MEMBER') {
      throw new Error('Only team leaders can register');
    }

    if (contest.teamSize && team.members.length !== contest.teamSize) {
      throw new Error(`Team must have exactly ${contest.teamSize} members`);
    }

    if (contest.entryFeeKr) {
      const entryFeePerMember = Number(contest.entryFeeKr);
      const totalEntryFee = entryFeePerMember * team.members.length;
      const platformFee = totalEntryFee * PLATFORM_FEE_RATE;
      const prizePoolAddition = totalEntryFee - platformFee;

      return prisma.$transaction(async (tx) => {
        for (const member of team.members) {
          const wallet = await tx.wallet.findUnique({ where: { userId: member.userId } });
          if (!wallet || wallet.krBalance.lessThan(entryFeePerMember)) {
            throw new Error(`${member.userId} has insufficient balance`);
          }

          await tx.wallet.update({
            where: { userId: member.userId },
            data: { krBalance: { decrement: entryFeePerMember } },
          });

          await tx.transaction.create({
            data: {
              userId: member.userId,
              type: 'contest_entry_fee',
              amountKr: new Prisma.Decimal(entryFeePerMember),
              status: 'completed',
              provider: 'platform',
              reference: contestId,
            },
          });
        }

        await tx.contest.update({
          where: { id: contestId },
          data: {
            prizeTotalKr: { increment: prizePoolAddition },
            platformFeeKr: { increment: platformFee },
          },
        });

        return tx.teamContestRegistration.create({
          data: { contestId, teamId },
        });
      });
    }

    return prisma.teamContestRegistration.create({
      data: { contestId, teamId },
    });
  }

  static async submitTeamEntry(data: {
    contestId: string;
    teamId: string;
    userId: string;
    mediaUrl: string;
    mediaType: string;
    caption?: string;
    contributors: string[];
  }) {
    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { members: true },
    });

    if (!team) throw new Error('Team not found');

    const member = team.members.find((m) => m.userId === data.userId);
    if (!member || member.role === 'MEMBER') {
      throw new Error('Only team leaders can submit');
    }

    const registration = await prisma.teamContestRegistration.findUnique({
      where: {
        contestId_teamId: {
          contestId: data.contestId,
          teamId: data.teamId,
        },
      },
    });

    if (!registration) throw new Error('Team not registered for this contest');

    return prisma.teamSubmission.create({
      data: {
        contestId: data.contestId,
        teamId: data.teamId,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        caption: data.caption,
        contributors: data.contributors,
      },
    });
  }

  static async getMyTeams(userId: string) {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => m.team);
  }

  static async getTeamStats(teamId: string) {
    const submissions = await prisma.teamSubmission.findMany({
      where: { teamId },
    });

    const wins = submissions.filter((s) => s.rank === 1).length;
    const topThree = submissions.filter((s) => s.rank && s.rank <= 3).length;

    const team = await prisma.team.findUnique({ where: { id: teamId } });

    return {
      teamId,
      totalContests: submissions.length,
      wins,
      topThree,
      totalPrizes: Number(team?.totalPrizes || 0),
      winRate: submissions.length > 0 ? wins / submissions.length : 0,
      averageRank: submissions.length > 0
        ? submissions.reduce((sum, s) => sum + (s.rank || 999), 0) / submissions.length
        : 0,
    };
  }
}
