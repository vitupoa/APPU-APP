import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

const PLATFORM_FEE_RATE = 0.15;

export class TeamsService {
  static async createTeam(data: {
    leaderId: string;
    name: string;
    avatar_url?: string;
    maxMembers: number;
  }) {
    if (data.maxMembers < 2 || data.maxMembers > 10) {
      throw new Error('Team size must be between 2 and 10 members');
    }

    return prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: data.name,
          avatar_url: data.avatar_url,
          leader_id: data.leaderId,
          max_members: data.maxMembers,
          updated_at: new Date(),
        },
      });

      await tx.team_members.create({
        data: {
          team_id: team.id,
          user_id: data.leaderId,
          role: 'LEADER',
        },
      });

      return team;
    });
  }

  static async inviteMember(teamId: string, inviterId: string, inviteeId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { team_members: true },
    });

    if (!team) throw new Error('Team not found');

    const inviterMember = team.team_members.find((m) => m.user_id === inviterId);
    if (!inviterMember || (inviterMember.role !== 'LEADER' && inviterMember.role !== 'CO_LEADER')) {
      throw new Error('Only leaders can invite members');
    }

    if (team.team_members.length >= team.max_members) {
      throw new Error('Team is full');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return prisma.team_invitations.create({
      data: {
        team_id: teamId,
        inviter_id: inviterId,
        invitee_id: inviteeId,
        expires_at: expiresAt,
      },
    });
  }

  static async respondToInvitation(invitationId: string, userId: string, accept: boolean) {
    const invitation = await prisma.team_invitations.findUnique({
      where: { id: invitationId },
      include: { Team: { include: { team_members: true } } },
    });

    if (!invitation) throw new Error('Invitation not found');
    if (invitation.invitee_id !== userId) throw new Error('Not authorized');
    if (invitation.status !== 'PENDING') throw new Error('Invitation already processed');
    if (new Date() > invitation.expires_at) throw new Error('Invitation expired');

    if (accept) {
      if (invitation.Team.team_members.length >= invitation.Team.max_members) {
        throw new Error('Team is full');
      }

      return prisma.$transaction([
        prisma.team_invitations.update({
          where: { id: invitationId },
          data: { status: 'ACCEPTED' },
        }),
        prisma.team_members.create({
          data: {
            team_id: invitation.team_id,
            user_id: userId,
            role: 'MEMBER',
          },
        }),
      ]);
    } else {
      return prisma.team_invitations.update({
        where: { id: invitationId },
        data: { status: 'REJECTED' },
      });
    }
  }

  static async registerTeamForContest(contestId: string, teamId: string, userId: string) {
    const contest = await prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) throw new Error('Contest not found');

    if (contest.participation_type === 'INDIVIDUAL_ONLY') {
      throw new Error('This contest is for individuals only');
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { team_members: true },
    });

    if (!team) throw new Error('Team not found');

    const member = team.team_members.find((m) => m.user_id === userId);
    if (!member || member.role === 'MEMBER') {
      throw new Error('Only team leaders can register');
    }

    if (contest.team_size && team.team_members.length !== contest.team_size) {
      throw new Error(`Team must have exactly ${contest.team_size} members`);
    }

    if (contest.entry_fee_kr) {
      const entryFeePerMember = Number(contest.entry_fee_kr);
      const totalEntryFee = entryFeePerMember * team.team_members.length;
      const platformFee = totalEntryFee * PLATFORM_FEE_RATE;
      const prizePoolAddition = totalEntryFee - platformFee;

      return prisma.$transaction(async (tx) => {
        for (const member of team.team_members) {
          const wallet = await tx.wallets.findUnique({ where: { user_id: member.user_id } });
          if (!wallet || wallet.kr_balance.lessThan(entryFeePerMember)) {
            throw new Error(`${member.user_id} has insufficient balance`);
          }

          await tx.wallets.update({
            where: { user_id: member.user_id },
            data: { kr_balance: { decrement: entryFeePerMember } },
          });

          await tx.transactions.create({
            data: {
              user_id: member.user_id,
              type: 'contest_entry_fee',
              amount_kr: new Prisma.Decimal(entryFeePerMember),
              status: 'completed',
              provider: 'platform',
              reference: contestId,
            },
          });
        }

        await tx.contest.update({
          where: { id: contestId },
          data: {
            prize_total_kr: { increment: prizePoolAddition },
            platform_fee_kr: { increment: platformFee },
          },
        });

        return tx.team_contest_registrations.create({
          data: { contest_id: contestId, team_id: teamId },
        });
      });
    }

    return prisma.team_contest_registrations.create({
      data: { contest_id: contestId, team_id: teamId },
    });
  }

  static async submitTeamEntry(data: {
    contest_id: string;
    teamId: string;
    userId: string;
    mediaUrl: string;
    mediaType: string;
    caption?: string;
    contributors: string[];
  }) {
    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { team_members: true },
    });

    if (!team) throw new Error('Team not found');

    const member = team.team_members.find((m) => m.user_id === data.userId);
    if (!member || member.role === 'MEMBER') {
      throw new Error('Only team leaders can submit');
    }

    const registration = await prisma.team_contest_registrations.findUnique({
      where: {
        contest_id_team_id: {
          contest_id: data.contest_id,
          team_id: data.teamId,
        },
      },
    });

    if (!registration) throw new Error('Team not registered for this contest');

    return prisma.team_submissions.create({
      data: {
        contest_id: data.contest_id,
        team_id: data.teamId,
        media_url: data.mediaUrl,
        media_type: data.mediaType,
        caption: data.caption,
        contributors: data.contributors,
      },
    });
  }

  static async getMyTeams(userId: string) {
    const memberships = await prisma.team_members.findMany({
      where: { user_id: userId },
      include: {
        Team: {
          include: {
            team_members: {
              include: {
                User: {
                  select: {
                    id: true,
                    username: true,
                    display_name: true,
                    avatar_url: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => m.Team);
  }

  static async getTeamStats(teamId: string) {
    const submissions = await prisma.team_submissions.findMany({
      where: { team_id: teamId },
    });

    const wins = submissions.filter((s) => s.rank === 1).length;
    const topThree = submissions.filter((s) => s.rank && s.rank <= 3).length;

    const team = await prisma.team.findUnique({ where: { id: teamId } });

    return {
      team_id: teamId,
      totalContests: submissions.length,
      wins,
      topThree,
      totalPrizes: Number(team?.total_prizes || 0),
      winRate: submissions.length > 0 ? wins / submissions.length : 0,
      averageRank: submissions.length > 0
        ? submissions.reduce((sum, s) => sum + (s.rank || 999), 0) / submissions.length
        : 0,
    };
  }
}
