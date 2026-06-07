import { prisma } from '../../config/database.js';
import { Logger } from '../../utils/logger.js';
import crypto from 'crypto';

const logger = new Logger('ChamaPatternDetection');

export class ChamaPatternDetectionService {
  async detectFakeChama(chamaId: string): Promise<{
    isSuspicious: boolean;
    suspicionScore: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let suspicionScore = 0;

    const chama = await prisma.chama.findUnique({
      where: { id: chamaId },
      include: {
        chama_members: true,
        chama_contributions: {
          orderBy: { created_at: 'desc' },
          take: 100
        },
        chama_payouts: {
          orderBy: { created_at: 'desc' },
          take: 50
        }
      }
    });

    if (!chama) throw new Error('Chama not found');

    // Check 1: Same device fingerprint across members
    const deviceFingerprints = chama.chama_members
      .map((m: any) => m.device_fingerprint)
      .filter(Boolean);

    if (deviceFingerprints.length > 0) {
      const uniqueDevices = new Set(deviceFingerprints);
      const deviceReuseRate = 1 - (uniqueDevices.size / deviceFingerprints.length);

      if (deviceReuseRate > 0.5) {
        suspicionScore += 30;
        reasons.push(`High device reuse rate: ${(deviceReuseRate * 100).toFixed(0)}% of members share devices`);
      }
    }

    // Check 2: Circular contribution patterns
    const contributions = chama.chama_contributions;
    if (contributions.length >= 3) {
      const contributorSequence = contributions.slice(0, 10).map((c: any) => c.member_id);
      const uniqueContributors = new Set(contributorSequence);

      if (uniqueContributors.size < contributorSequence.length * 0.5) {
        suspicionScore += 20;
        reasons.push('Circular contribution pattern detected');
      }
    }

    // Check 3: Rapid contribution-to-payout cycles
    const payouts = chama.chama_payouts;
    if (payouts.length > 0 && contributions.length > 0) {
      const firstContribution = contributions[contributions.length - 1];
      const firstPayout = payouts[payouts.length - 1];

      const timeDiff = firstPayout.created_at.getTime() - firstContribution.created_at.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff < 168) { // Less than 7 days
        suspicionScore += 25;
        reasons.push(`Rapid payout cycle: ${hoursDiff.toFixed(0)} hours from first contribution to first payout`);
      }
    }

    // Check 4: Disproportionate payouts to one member
    if (payouts.length >= 3) {
      const payoutsByMember: Record<string, number> = {};

      for (const payout of payouts) {
        payoutsByMember[payout.recipient_id] = (payoutsByMember[payout.recipient_id] || 0) + Number(payout.amount_kr);
      }

      const totalPayouts = Object.values(payoutsByMember).reduce((sum, amt) => sum + amt, 0);
      const maxPayout = Math.max(...Object.values(payoutsByMember));

      if (maxPayout > totalPayouts * 0.7) {
        suspicionScore += 25;
        reasons.push('One member received disproportionate payouts (>70% of total)');
      }
    }

    const isSuspicious = suspicionScore >= 50;

    if (isSuspicious) {
      await this.flagChama(chamaId, suspicionScore, reasons);
    }

    return {
      isSuspicious,
      suspicionScore,
      reasons
    };
  }

  private async flagChama(chamaId: string, suspicionScore: number, reasons: string[]): Promise<void> {
    const chama = await prisma.chama.findUnique({
      where: { id: chamaId },
      select: { creator_id: true }
    });

    if (!chama) return;

    await prisma.suspicious_activity_logs.create({
      data: {
        user_id: chama.creator_id,
        activityType: 'FAKE_CHAMA',
        severity: suspicionScore >= 70 ? 'HIGH' : 'MEDIUM',
        description: `Suspicious chama pattern detected: ${reasons.join(', ')}`,
        metadata: {
          chama_id: chamaId,
          suspicion_score: suspicionScore,
          reasons
        }
      }
    });

    logger.warn(`Chama ${chamaId} flagged with suspicion score ${suspicionScore}`);
  }

  async enforceCoolingOffPeriod(chamaId: string): Promise<boolean> {
    const chama = await prisma.chama.findUnique({
      where: { id: chamaId },
      include: {
        chama_payouts: {
          orderBy: { created_at: 'asc' },
          take: 1
        }
      }
    });

    if (!chama) throw new Error('Chama not found');

    const chamaAge = Date.now() - chama.created_at.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    if (chamaAge < sevenDaysMs && chama.chama_payouts.length === 0) {
      return false; // Block payout
    }

    return true; // Allow payout
  }
}

export const chamaPatternDetectionService = new ChamaPatternDetectionService();
