import { prisma } from '../../config/database.js';
import { Chama_Member_Role, Chama_Election_Phase } from '@prisma/client';
import { randomUUID } from 'crypto';


export class ChamaElectionService {
  /**
   * Start an election for a specific position.
   * Only ADMIN can start elections. isMidTerm = true if replacing current holder.
   */
  static async startElection(adminId: string, chamaId: string, position: Chama_Member_Role, isMidTerm: boolean = false) {
    const admin = await prisma.chamaMember.findUnique({
      where: { chama_id_user_id: { chama_id: chamaId, user_id: adminId } },
    });
    if (!admin || admin.role !== 'ADMIN') throw new Error('Only Admin can start elections');

    if (!['CHAIRPERSON', 'TREASURER', 'SECRETARY'].includes(position)) {
      throw new Error('Elections can only be held for Chairperson, Treasurer, or Secretary');
    }

    // Check no active election for this position
    const activeElection = await prisma.chamaElection.findFirst({
      where: {
        chama_id: chamaId,
        position,
        phase: { notIn: ['COMPLETED'] },
      },
    });
    if (activeElection) throw new Error(`An election for ${position} is already in progress`);

    const chama = await prisma.chama.findUnique({ where: { id: chamaId } });
    if (!chama) throw new Error('Chama not found');

    const election = await prisma.chamaElection.create({
      data: { 
        id: randomUUID(),
        chama_id: chamaId, 
        position, 
        is_mid_term: isMidTerm, 
        phase: 'NOMINATION',
        updated_at: new Date()
      },
    });

    await prisma.messages.create({
      data: {
        id: randomUUID(),
        chat_id: chama.chat_id,
        sender_id: adminId,
        payload: `🗳️ Election for ${position} has started${isMidTerm ? ' (mid-term)' : ''}! Nomination phase is now open.`,
        is_system_event: true,
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
    if (!election || election.chama_id !== chamaId) throw new Error('Election not found');
    if (election.phase !== 'NOMINATION') throw new Error('Election is not in NOMINATION phase');

    // Verify both are members
    const nominator = await prisma.chamaMember.findUnique({
      where: { chama_id_user_id: { chama_id: chamaId, user_id: nominatorId } },
    });
    if (!nominator || nominator.status !== 'ACTIVE') throw new Error('You must be an active member to nominate');

    const nominee = await prisma.chamaMember.findUnique({
      where: { chama_id_user_id: { chama_id: chamaId, user_id: nomineeId } },
    });
    if (!nominee || nominee.status !== 'ACTIVE') throw new Error('Nominee must be an active member');

    const nomination = await prisma.chamaNomination.create({
      data: { 
        id: randomUUID(),
        election_id: electionId, 
        nominee_id: nomineeId, 
        nominator_id: nominatorId 
      },
    });

    const chama = await prisma.chama.findUnique({ where: { id: chamaId } });
    const nomineeUser = await prisma.user.findUnique({ where: { id: nomineeId }, select: { display_name: true } });
    const nominatorUser = await prisma.user.findUnique({ where: { id: nominatorId }, select: { display_name: true } });

    await prisma.messages.create({
      data: {
        id: randomUUID(),
        chat_id: chama!.chat_id,
        sender_id: nominatorId,
        payload: `📝 ${nominatorUser?.display_name} nominated ${nomineeUser?.display_name} for ${election.position}. Seconding is required.`,
        is_system_event: true,
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
    if (!election || election.chama_id !== chamaId) throw new Error('Election not found');
    if (election.phase !== 'NOMINATION' && election.phase !== 'SECONDING') {
      throw new Error('Election is not accepting seconds');
    }

    const seconder = await prisma.chamaMember.findUnique({
      where: { chama_id_user_id: { chama_id: chamaId, user_id: seconderId } },
    });
    if (!seconder || seconder.status !== 'ACTIVE') throw new Error('You must be an active member');

    const nomination = await prisma.chamaNomination.findUnique({ where: { id: nominationId } });
    if (!nomination || nomination.election_id !== electionId) throw new Error('Nomination not found');
    if (nomination.nominee_id === seconderId) throw new Error('Cannot second your own nomination');
    if (nomination.nominator_id === seconderId) throw new Error('Nominator cannot second their own nomination');

    await prisma.chamaSecondment.create({
      data: { 
        id: randomUUID(),
        nomination_id: nominationId, 
        seconder_id: seconderId 
      },
    });

    // Increment seconds count
    await prisma.chamaNomination.update({
      where: { id: nominationId },
      data: { seconds_count: { increment: 1 } },
    });

    // Move to seconding phase if still in nomination
    if (election.phase === 'NOMINATION') {
      await prisma.chamaElection.update({
        where: { id: electionId },
        data: { phase: 'SECONDING', updated_at: new Date() },
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
      where: { chama_id_user_id: { chama_id: chamaId, user_id: adminId } },
    });
    if (!admin || admin.role !== 'ADMIN') throw new Error('Only Admin can advance elections');

    const election = await prisma.chamaElection.findUnique({
      where: { id: electionId },
      include: { nominations: { orderBy: { seconds_count: 'desc' } } },
    });
    if (!election || election.chama_id !== chamaId) throw new Error('Election not found');
    if (election.phase !== 'SECONDING' && election.phase !== 'NOMINATION') {
      throw new Error('Election must be in NOMINATION or SECONDING phase');
    }

    // Only nominations with at least 1 second can proceed
    const qualified = election.nominations.filter((n: any) => n.seconds_count > 0);
    if (qualified.length === 0) throw new Error('No nominations have been seconded');

    if (qualified.length === 1) {
      // Auto-elect if only one qualified nominee
      return ChamaElectionService.electWinner(chamaId, electionId, qualified[0].nominee_id);
    }

    await prisma.chamaElection.update({
      where: { id: electionId },
      data: { phase: 'VOTING', updated_at: new Date() },
    });

    const chama = await prisma.chama.findUnique({ where: { id: chamaId } });
    await prisma.messages.create({
      data: {
        id: randomUUID(),
        chat_id: chama!.chat_id,
        sender_id: adminId,
        payload: `🗳️ Voting phase for ${election.position} is now open! ${qualified.length} candidates are on the ballot.`,
        is_system_event: true,
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
    if (!election || election.chama_id !== chamaId) throw new Error('Election not found');
    if (election.phase !== 'VOTING') throw new Error('Election is not in VOTING phase');

    const voter = await prisma.chamaMember.findUnique({
      where: { chama_id_user_id: { chama_id: chamaId, user_id: voterId } },
    });
    if (!voter || voter.status !== 'ACTIVE') throw new Error('You must be an active member to vote');

    await prisma.chamaVote.create({
      data: { 
        id: randomUUID(),
        election_id: electionId, 
        nomination_id: nominationId, 
        voter_id: voterId 
      },
    });

    return { success: true };
  }

  /**
   * Tally votes and determine winner. Handles ties by triggering re-run.
   */
  static async tallyVotes(adminId: string, chamaId: string, electionId: string) {
    const admin = await prisma.chamaMember.findUnique({
      where: { chama_id_user_id: { chama_id: chamaId, user_id: adminId } },
    });
    if (!admin || admin.role !== 'ADMIN') throw new Error('Only Admin can tally votes');

    const election = await prisma.chamaElection.findUnique({
      where: { id: electionId },
      include: {
        nominations: {
          where: { seconds_count: { gt: 0 } },
          include: { _count: { select: { votes: true } }, nominee: { select: { id: true, display_name: true } } },
        },
      },
    });
    if (!election || election.chama_id !== chamaId) throw new Error('Election not found');
    if (election.phase !== 'VOTING') throw new Error('Election must be in VOTING phase to tally');

    // Sort by vote count desc
    const sorted = election.nominations.sort((a: any, b: any) => b._count.votes - a._count.votes);

    if (sorted.length === 0) throw new Error('No votes cast');

    const topVotes = sorted[0]._count.votes;
    const tiedCandidates = sorted.filter((n: any) => n._count.votes === topVotes);

    const chama = await prisma.chama.findUnique({ where: { id: chamaId } });

    if (tiedCandidates.length > 1) {
      // Tie — trigger re-run
      await prisma.chamaElection.update({
        where: { id: electionId },
        data: { phase: 'RERUN', updated_at: new Date() },
      });

      // Clear previous votes for re-run
      await prisma.chamaVote.deleteMany({ where: { election_id: electionId } });

      const tiedNames = tiedCandidates.map((c: any) => c.nominee.display_name).join(', ');
      await prisma.messages.create({
        data: {
          id: randomUUID(),
          chat_id: chama!.chat_id,
          sender_id: adminId,
          payload: `⚖️ TIE! ${tiedNames} each received ${topVotes} votes for ${election.position}. A re-run vote will be held.`,
          is_system_event: true,
          status: 'sent',
        },
      });

      // Re-open voting
      await prisma.chamaElection.update({
        where: { id: electionId },
        data: { phase: 'VOTING', updated_at: new Date() },
      });

      return { success: true, result: 'TIE', tiedCandidates: tiedNames };
    }

    // We have a winner
    return ChamaElectionService.electWinner(chamaId, electionId, sorted[0].nominee_id);
  }

  /**
   * Internal: Elect a winner, update roles.
   */
  private static async electWinner(chamaId: string, electionId: string, winnerId: string) {
    const election = await prisma.chamaElection.findUnique({ where: { id: electionId } });
    if (!election) throw new Error('Election not found');

    // Remove previous holder of this position
    const previousHolder = await prisma.chamaMember.findFirst({
      where: { chama_id: chamaId, role: election.position, status: 'ACTIVE' },
    });
    if (previousHolder) {
      await prisma.chamaMember.update({
        where: { id: previousHolder.id },
        data: { role: 'MEMBER', updated_at: new Date() },
      });
    }

    // Assign role to winner
    await prisma.chamaMember.updateMany({
      where: { chama_id: chamaId, user_id: winnerId, status: 'ACTIVE' },
      data: { role: election.position, updated_at: new Date() },
    });

    // Complete election
    await prisma.chamaElection.update({
      where: { id: electionId },
      data: { phase: 'COMPLETED', completed_at: new Date(), updated_at: new Date() },
    });

    const chama = await prisma.chama.findUnique({ where: { id: chamaId } });
    const winner = await prisma.user.findUnique({ where: { id: winnerId }, select: { display_name: true } });

    await prisma.messages.create({
      data: {
        id: randomUUID(),
        chat_id: chama!.chat_id,
        sender_id: winnerId,
        payload: `🎉 ${winner?.display_name} has been elected as ${election.position}! Congratulations!`,
        is_system_event: true,
        status: 'sent',
      },
    });

    return { success: true, result: 'ELECTED', winner: winner?.display_name, position: election.position };
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
            nominee: { select: { id: true, username: true, display_name: true, avatar_url: true } },
            nominator: { select: { id: true, display_name: true } },
            _count: { select: { secondments: true, votes: true } },
          },
          orderBy: { seconds_count: 'desc' },
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
        chama_id: chamaId,
        phase: { notIn: ['COMPLETED'] }
      },
      include: {
        nominations: {
          include: {
            nominee: { select: { id: true, username: true, display_name: true, avatar_url: true } },
            nominator: { select: { id: true, display_name: true } },
            _count: { select: { secondments: true, votes: true } },
          },
          orderBy: { seconds_count: 'desc' },
        },
      },
    });
  }
}
