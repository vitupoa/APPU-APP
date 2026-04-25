import { prisma } from '../../config/database.js';
import { ChamaRole, ElectionPhase } from '../../generated/prisma/client.js';

export class ChamaElectionService {
  /**
   * Start an election for a specific position.
   * Only ADMIN can start elections. isMidTerm = true if replacing current holder.
   */
  static async startElection(adminId: string, chamaId: string, position: ChamaRole, isMidTerm: boolean = false) {
    const admin = await prisma.chamaMember.findUnique({
      where: { chamaId_userId: { chamaId, userId: adminId } },
    });
    if (!admin || admin.role !== 'ADMIN') throw new Error('Only Admin can start elections');

    if (!['CHAIRPERSON', 'TREASURER', 'SECRETARY'].includes(position)) {
      throw new Error('Elections can only be held for Chairperson, Treasurer, or Secretary');
    }

    // Check no active election for this position
    const activeElection = await prisma.chamaElection.findFirst({
      where: {
        chamaId,
        position,
        phase: { notIn: ['COMPLETED'] },
      },
    });
    if (activeElection) throw new Error(`An election for ${position} is already in progress`);

    const chama = await prisma.chama.findUnique({ where: { id: chamaId } });
    if (!chama) throw new Error('Chama not found');

    // If mid-term vote-out and chama doesn't allow it
    if (isMidTerm && !chama.allowMidTermVoteOut) {
      throw new Error('This Chama does not allow mid-term vote-outs per its by-laws');
    }

    const election = await prisma.chamaElection.create({
      data: { chamaId, position, isMidTerm, phase: 'NOMINATION' },
    });

    await prisma.message.create({
      data: {
        chatId: chama.chatId,
        senderId: adminId,
        payload: `🗳️ Election for ${position} has started${isMidTerm ? ' (mid-term)' : ''}! Nomination phase is now open.`,
        isSystemEvent: true,
        status: 'sent',
      },
    });

    return { success: true, election };
  }

  /**
   * Nominate a member for a position.
   */
  static async nominate(nominatorId: string, chamaId: string, electionId: string, nomineeId: string) {
    const election = await prisma.chamaElection.findUnique({ where: { id: electionId } });
    if (!election || election.chamaId !== chamaId) throw new Error('Election not found');
    if (election.phase !== 'NOMINATION') throw new Error('Election is not in NOMINATION phase');

    // Verify both are members
    const nominator = await prisma.chamaMember.findUnique({
      where: { chamaId_userId: { chamaId, userId: nominatorId } },
    });
    if (!nominator || nominator.status !== 'ACTIVE') throw new Error('You must be an active member to nominate');

    const nominee = await prisma.chamaMember.findUnique({
      where: { chamaId_userId: { chamaId, userId: nomineeId } },
    });
    if (!nominee || nominee.status !== 'ACTIVE') throw new Error('Nominee must be an active member');

    const nomination = await prisma.chamaNomination.create({
      data: { electionId, nomineeId, nominatorId },
    });

    const chama = await prisma.chama.findUnique({ where: { id: chamaId } });
    const nomineeUser = await prisma.user.findUnique({ where: { id: nomineeId }, select: { displayName: true } });
    const nominatorUser = await prisma.user.findUnique({ where: { id: nominatorId }, select: { displayName: true } });

    await prisma.message.create({
      data: {
        chatId: chama!.chatId,
        senderId: nominatorId,
        payload: `📝 ${nominatorUser?.displayName} nominated ${nomineeUser?.displayName} for ${election.position}. Seconding is required.`,
        isSystemEvent: true,
        status: 'sent',
      },
    });

    return { success: true, nomination };
  }

  /**
   * Second a nomination.
   */
  static async secondNomination(seconderId: string, chamaId: string, electionId: string, nominationId: string) {
    const election = await prisma.chamaElection.findUnique({ where: { id: electionId } });
    if (!election || election.chamaId !== chamaId) throw new Error('Election not found');
    if (election.phase !== 'NOMINATION' && election.phase !== 'SECONDING') {
      throw new Error('Election is not accepting seconds');
    }

    const seconder = await prisma.chamaMember.findUnique({
      where: { chamaId_userId: { chamaId, userId: seconderId } },
    });
    if (!seconder || seconder.status !== 'ACTIVE') throw new Error('You must be an active member');

    const nomination = await prisma.chamaNomination.findUnique({ where: { id: nominationId } });
    if (!nomination || nomination.electionId !== electionId) throw new Error('Nomination not found');
    if (nomination.nomineeId === seconderId) throw new Error('Cannot second your own nomination');
    if (nomination.nominatorId === seconderId) throw new Error('Nominator cannot second their own nomination');

    await prisma.chamaSecondment.create({
      data: { nominationId, seconderId },
    });

    // Increment seconds count
    await prisma.chamaNomination.update({
      where: { id: nominationId },
      data: { secondsCount: { increment: 1 } },
    });

    // Move to seconding phase if still in nomination
    if (election.phase === 'NOMINATION') {
      await prisma.chamaElection.update({
        where: { id: electionId },
        data: { phase: 'SECONDING' },
      });
    }

    return { success: true };
  }

  /**
   * Admin advances election to VOTING phase.
   * Only nominations with the most seconds proceed.
   */
  static async advanceToVoting(adminId: string, chamaId: string, electionId: string) {
    const admin = await prisma.chamaMember.findUnique({
      where: { chamaId_userId: { chamaId, userId: adminId } },
    });
    if (!admin || admin.role !== 'ADMIN') throw new Error('Only Admin can advance elections');

    const election = await prisma.chamaElection.findUnique({
      where: { id: electionId },
      include: { nominations: { orderBy: { secondsCount: 'desc' } } },
    });
    if (!election || election.chamaId !== chamaId) throw new Error('Election not found');
    if (election.phase !== 'SECONDING' && election.phase !== 'NOMINATION') {
      throw new Error('Election must be in NOMINATION or SECONDING phase');
    }

    // Only nominations with at least 1 second can proceed
    const qualified = election.nominations.filter(n => n.secondsCount > 0);
    if (qualified.length === 0) throw new Error('No nominations have been seconded');

    if (qualified.length === 1) {
      // Auto-elect if only one qualified nominee
      return ChamaElectionService.electWinner(chamaId, electionId, qualified[0].nomineeId);
    }

    await prisma.chamaElection.update({
      where: { id: electionId },
      data: { phase: 'VOTING' },
    });

    const chama = await prisma.chama.findUnique({ where: { id: chamaId } });
    await prisma.message.create({
      data: {
        chatId: chama!.chatId,
        senderId: adminId,
        payload: `🗳️ Voting phase for ${election.position} is now open! ${qualified.length} candidates are on the ballot.`,
        isSystemEvent: true,
        status: 'sent',
      },
    });

    return { success: true, phase: 'VOTING', candidates: qualified.length };
  }

  /**
   * Cast a vote for a nominee.
   */
  static async castVote(voterId: string, chamaId: string, electionId: string, nominationId: string) {
    const election = await prisma.chamaElection.findUnique({ where: { id: electionId } });
    if (!election || election.chamaId !== chamaId) throw new Error('Election not found');
    if (election.phase !== 'VOTING') throw new Error('Election is not in VOTING phase');

    const voter = await prisma.chamaMember.findUnique({
      where: { chamaId_userId: { chamaId, userId: voterId } },
    });
    if (!voter || voter.status !== 'ACTIVE') throw new Error('You must be an active member to vote');

    await prisma.chamaVote.create({
      data: { electionId, nominationId, voterId },
    });

    return { success: true };
  }

  /**
   * Tally votes and determine winner. Handles ties by triggering re-run.
   */
  static async tallyVotes(adminId: string, chamaId: string, electionId: string) {
    const admin = await prisma.chamaMember.findUnique({
      where: { chamaId_userId: { chamaId, userId: adminId } },
    });
    if (!admin || admin.role !== 'ADMIN') throw new Error('Only Admin can tally votes');

    const election = await prisma.chamaElection.findUnique({
      where: { id: electionId },
      include: {
        nominations: {
          where: { secondsCount: { gt: 0 } },
          include: { _count: { select: { votes: true } }, nominee: { select: { id: true, displayName: true } } },
        },
      },
    });
    if (!election || election.chamaId !== chamaId) throw new Error('Election not found');
    if (election.phase !== 'VOTING') throw new Error('Election must be in VOTING phase to tally');

    // Sort by vote count desc
    const sorted = election.nominations.sort((a, b) => b._count.votes - a._count.votes);

    if (sorted.length === 0) throw new Error('No votes cast');

    const topVotes = sorted[0]._count.votes;
    const tiedCandidates = sorted.filter(n => n._count.votes === topVotes);

    const chama = await prisma.chama.findUnique({ where: { id: chamaId } });

    if (tiedCandidates.length > 1) {
      // Tie — trigger re-run
      await prisma.chamaElection.update({
        where: { id: electionId },
        data: { phase: 'RERUN' },
      });

      // Clear previous votes for re-run
      await prisma.chamaVote.deleteMany({ where: { electionId } });

      const tiedNames = tiedCandidates.map(c => c.nominee.displayName).join(', ');
      await prisma.message.create({
        data: {
          chatId: chama!.chatId,
          senderId: adminId,
          payload: `⚖️ TIE! ${tiedNames} each received ${topVotes} votes for ${election.position}. A re-run vote will be held.`,
          isSystemEvent: true,
          status: 'sent',
        },
      });

      // Re-open voting
      await prisma.chamaElection.update({
        where: { id: electionId },
        data: { phase: 'VOTING' },
      });

      return { success: true, result: 'TIE', tiedCandidates: tiedNames };
    }

    // We have a winner
    return ChamaElectionService.electWinner(chamaId, electionId, sorted[0].nomineeId);
  }

  /**
   * Internal: Elect a winner, update roles.
   */
  private static async electWinner(chamaId: string, electionId: string, winnerId: string) {
    const election = await prisma.chamaElection.findUnique({ where: { id: electionId } });
    if (!election) throw new Error('Election not found');

    // Remove previous holder of this position
    const previousHolder = await prisma.chamaMember.findFirst({
      where: { chamaId, role: election.position, status: 'ACTIVE' },
    });
    if (previousHolder) {
      await prisma.chamaMember.update({
        where: { id: previousHolder.id },
        data: { role: 'MEMBER' },
      });
    }

    // Assign role to winner
    await prisma.chamaMember.updateMany({
      where: { chamaId, userId: winnerId, status: 'ACTIVE' },
      data: { role: election.position },
    });

    // Complete election
    await prisma.chamaElection.update({
      where: { id: electionId },
      data: { phase: 'COMPLETED', completedAt: new Date() },
    });

    const chama = await prisma.chama.findUnique({ where: { id: chamaId } });
    const winner = await prisma.user.findUnique({ where: { id: winnerId }, select: { displayName: true } });

    await prisma.message.create({
      data: {
        chatId: chama!.chatId,
        senderId: winnerId,
        payload: `🎉 ${winner?.displayName} has been elected as ${election.position}! Congratulations!`,
        isSystemEvent: true,
        status: 'sent',
      },
    });

    return { success: true, result: 'ELECTED', winner: winner?.displayName, position: election.position };
  }

  /**
   * Get election status with all nominations, seconds, and votes.
   */
  static async getElectionStatus(chamaId: string, electionId: string) {
    return prisma.chamaElection.findUnique({
      where: { id: electionId },
      include: {
        nominations: {
          include: {
            nominee: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            nominator: { select: { id: true, displayName: true } },
            _count: { select: { seconds: true, votes: true } },
          },
          orderBy: { secondsCount: 'desc' },
        },
      },
    });
  }

  /**
   * Get active elections for a Chama
   */
  static async getActiveElections(chamaId: string) {
    return prisma.chamaElection.findMany({
      where: {
        chamaId,
        phase: { notIn: ['COMPLETED'] }
      },
      include: {
        nominations: {
          include: {
            nominee: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            nominator: { select: { id: true, displayName: true } },
            _count: { select: { seconds: true, votes: true } },
          },
          orderBy: { secondsCount: 'desc' },
        },
      },
    });
  }
}
