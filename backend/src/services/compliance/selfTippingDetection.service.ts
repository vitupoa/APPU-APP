import { prisma } from '../../config/database.js';

/**
 * Self-Tipping Detection Service
 * 
 * Detects users attempting to launder money through self-tipping schemes.
 * 
 * Detection Patterns:
 * 1. Device Fingerprint Sharing: Multiple accounts using same device
 * 2. Interaction Exclusivity: Accounts only tipping each other (no other interactions)
 * 3. Rapid Cycles: Buy Kr → Tip → Withdraw within 1 hour
 * 4. Circular Patterns: A tips B, B tips C, C tips A
 * 
 * Score: 0-100 (>70 = flagged)
 */
export class SelfTippingDetectionService {
  /**
   * Main detection method - calculates comprehensive self-tipping score
   * 
   * @param userId - User ID to analyze
   * @returns Self-tipping score (0-100) and detailed breakdown
   */
  async detectSelfTipping(userId: string): Promise<{
    score: number;
    level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    flagged: boolean;
    patterns: {
      deviceSharing: {
        score: number;
        sharedDeviceUsers: string[];
        tipsToSharedUsers: number;
      };
      interactionExclusivity: {
        score: number;
        exclusivityPercentage: number;
        exclusivePartners: string[];
      };
      rapidCycles: {
        score: number;
        cyclesDetected: number;
        fastestCycleMinutes: number | null;
      };
      circularPatterns: {
        score: number;
        circularPaths: Array<{
          path: string[];
          length: number;
        }>;
      };
    };
  }> {
    // 1. Device Fingerprint Sharing (0-25 points)
    const deviceSharing = await this.detectDeviceSharing(userId);

    // 2. Interaction Exclusivity (0-25 points)
    const interactionExclusivity = await this.detectInteractionExclusivity(userId);

    // 3. Rapid Buy-Tip-Withdraw Cycles (0-25 points)
    const rapidCycles = await this.detectRapidCycles(userId);

    // 4. Circular Tipping Patterns (0-25 points)
    const circularPatterns = await this.detectCircularPatterns(userId);

    // Calculate total score
    const score = Math.min(
      deviceSharing.score +
      interactionExclusivity.score +
      rapidCycles.score +
      circularPatterns.score,
      100
    );

    // Determine level
    let level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (score >= 70) level = 'CRITICAL';
    else if (score >= 50) level = 'HIGH';
    else if (score >= 30) level = 'MEDIUM';
    else if (score >= 10) level = 'LOW';
    else level = 'NONE';

    const flagged = score > 70;

    return {
      score,
      level,
      flagged,
      patterns: {
        deviceSharing,
        interactionExclusivity,
        rapidCycles,
        circularPatterns
      }
    };
  }

  /**
   * Pattern 1: Device Fingerprint Sharing
   * Detects multiple accounts using the same device
   * 
   * Score breakdown:
   * - 0 points: No shared devices
   * - 5 points: Shared device but no tips between accounts
   * - 15 points: Shared device with occasional tips
   * - 25 points: Shared device with frequent tips
   */
  private async detectDeviceSharing(userId: string): Promise<{
    score: number;
    sharedDeviceUsers: string[];
    tipsToSharedUsers: number;
  }> {
    // Get user's device fingerprints
    const userDevices = await prisma.device_fingerprints.findMany({
      where: { user_id: userId },
      select: { fingerprint_hash: true }
    });

    if (userDevices.length === 0) {
      return { score: 0, sharedDeviceUsers: [], tipsToSharedUsers: 0 };
    }

    const fingerprintHashes = userDevices.map(d => d.fingerprint_hash);

    // Find other users using the same devices
    const sharedDeviceRecords = await prisma.device_fingerprints.findMany({
      where: {
        fingerprint_hash: { in: fingerprintHashes },
        user_id: { not: userId }
      },
      select: { user_id: true },
      distinct: ['user_id']
    });

    const sharedDeviceUsers = sharedDeviceRecords.map(d => d.user_id);

    if (sharedDeviceUsers.length === 0) {
      return { score: 0, sharedDeviceUsers: [], tipsToSharedUsers: 0 };
    }

    // Check if user tips these shared-device users
    const tipsToSharedUsers = await prisma.transactions.count({
      where: {
        user_id: userId,
        OR: [
          { context_type: 'CONTENT_TIP' },
          { transaction_type: 'CONTENT_TIP' }
        ],
        counterparty_id: { in: sharedDeviceUsers },
        status: 'COMPLETED'
      }
    });

    // Also check reverse tips (shared users tipping back)
    const tipsFromSharedUsers = await prisma.transactions.count({
      where: {
        user_id: { in: sharedDeviceUsers },
        OR: [
          { context_type: 'CONTENT_TIP' },
          { transaction_type: 'CONTENT_TIP' }
        ],
        counterparty_id: userId,
        status: 'COMPLETED'
      }
    });

    const totalTips = tipsToSharedUsers + tipsFromSharedUsers;

    // Calculate score
    let score = 0;
    if (totalTips > 20) {
      score = 25; // Frequent tipping between shared-device accounts
    } else if (totalTips > 10) {
      score = 20;
    } else if (totalTips > 5) {
      score = 15;
    } else if (totalTips > 0) {
      score = 10;
    } else if (sharedDeviceUsers.length > 0) {
      score = 5; // Shared device but no tips (still suspicious)
    }

    return {
      score: Math.min(score, 25),
      sharedDeviceUsers,
      tipsToSharedUsers: totalTips
    };
  }

  /**
   * Pattern 2: Interaction Exclusivity
   * Detects accounts that only tip each other (no other interactions)
   * 
   * Score breakdown:
   * - 0 points: Diverse interactions (< 30% exclusive)
   * - 10 points: Somewhat exclusive (30-50%)
   * - 20 points: Highly exclusive (50-80%)
   * - 25 points: Almost exclusively tip each other (> 80%)
   */
  private async detectInteractionExclusivity(userId: string): Promise<{
    score: number;
    exclusivityPercentage: number;
    exclusivePartners: string[];
  }> {
    // Get all users this user has tipped
    const outgoingTips = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        OR: [
          { context_type: 'CONTENT_TIP' },
          { transaction_type: 'CONTENT_TIP' }
        ],
        status: 'COMPLETED',
        counterparty_id: { not: null }
      },
      select: { counterparty_id: true }
    });

    const tippedUsers = [...new Set(outgoingTips.map(t => t.counterparty_id).filter(Boolean))] as string[];

    if (tippedUsers.length === 0) {
      return { score: 0, exclusivityPercentage: 0, exclusivePartners: [] };
    }

    // Get all users who have tipped this user
    const incomingTips = await prisma.transactions.findMany({
      where: {
        counterparty_id: userId,
        OR: [
          { context_type: 'CONTENT_TIP' },
          { transaction_type: 'CONTENT_TIP' }
        ],
        status: 'COMPLETED'
      },
      select: { user_id: true }
    });

    const tippersToUser = [...new Set(incomingTips.map(t => t.user_id))] as string[];

    // Find users who both tip and receive tips from this user (mutual tipping)
    const mutualTippers = tippedUsers.filter(u => tippersToUser.includes(u));

    if (mutualTippers.length === 0) {
      return { score: 0, exclusivityPercentage: 0, exclusivePartners: [] };
    }

    // Calculate exclusivity: what percentage of tips are to/from mutual tippers?
    const tipsToMutual = outgoingTips.filter(t => mutualTippers.includes(t.counterparty_id!)).length;
    const tipsFromMutual = incomingTips.filter(t => mutualTippers.includes(t.user_id)).length;
    const totalTips = outgoingTips.length + incomingTips.length;

    const exclusivityPercentage = totalTips > 0 
      ? ((tipsToMutual + tipsFromMutual) / totalTips) * 100 
      : 0;

    // Check if mutual tippers also only tip each other (closed network)
    const exclusivePartners: string[] = [];
    for (const partnerId of mutualTippers) {
      const partnerOutgoingTips = await prisma.transactions.findMany({
        where: {
          user_id: partnerId,
          OR: [
            { context_type: 'CONTENT_TIP' },
            { transaction_type: 'CONTENT_TIP' }
          ],
          status: 'COMPLETED',
          counterparty_id: { not: null }
        },
        select: { counterparty_id: true }
      });

      const partnerTippedUsers = [...new Set(partnerOutgoingTips.map(t => t.counterparty_id).filter(Boolean))];
      
      // If partner mostly tips users in the mutual group, they're exclusive
      const tipsToGroup = partnerOutgoingTips.filter(t => 
        mutualTippers.includes(t.counterparty_id!) || t.counterparty_id === userId
      ).length;
      
      const partnerExclusivity = partnerOutgoingTips.length > 0 
        ? (tipsToGroup / partnerOutgoingTips.length) * 100 
        : 0;

      if (partnerExclusivity > 70) {
        exclusivePartners.push(partnerId);
      }
    }

    // Calculate score
    let score = 0;
    if (exclusivityPercentage > 80 && exclusivePartners.length > 0) {
      score = 25; // Closed network of accounts only tipping each other
    } else if (exclusivityPercentage > 70) {
      score = 20;
    } else if (exclusivityPercentage > 50) {
      score = 15;
    } else if (exclusivityPercentage > 30) {
      score = 10;
    }

    return {
      score: Math.min(score, 25),
      exclusivityPercentage: Math.round(exclusivityPercentage * 100) / 100,
      exclusivePartners
    };
  }

  /**
   * Pattern 3: Rapid Buy-Tip-Withdraw Cycles
   * Detects rapid cycles: Buy Kr → Tip → Withdraw within 1 hour
   * 
   * Score breakdown:
   * - 0 points: No rapid cycles
   * - 10 points: 1-2 rapid cycles
   * - 20 points: 3-5 rapid cycles
   * - 25 points: 6+ rapid cycles
   */
  private async detectRapidCycles(userId: string): Promise<{
    score: number;
    cyclesDetected: number;
    fastestCycleMinutes: number | null;
  }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get all transactions in chronological order
    const transactions = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        created_at: { gte: thirtyDaysAgo },
        status: 'COMPLETED'
      },
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        type: true,
        context_type: true,
        transaction_type: true,
        created_at: true,
        amount_kr: true
      }
    });

    let cyclesDetected = 0;
    let fastestCycleMinutes: number | null = null;

    // Look for pattern: TOP_UP → CONTENT_TIP → WITHDRAWAL within 1 hour
    for (let i = 0; i < transactions.length - 2; i++) {
      const tx1 = transactions[i];
      const tx2 = transactions[i + 1];
      const tx3 = transactions[i + 2];

      // Check if it's a TOP_UP → TIP → WITHDRAWAL sequence
      const isTopUp = tx1.type === 'TOP_UP' || tx1.transaction_type === 'TOP_UP';
      const isTip = tx2.context_type === 'CONTENT_TIP' || tx2.transaction_type === 'CONTENT_TIP';
      const isWithdrawal = tx3.type === 'WITHDRAWAL' || tx3.transaction_type === 'WITHDRAWAL';

      if (isTopUp && isTip && isWithdrawal) {
        // Check if all three happen within 1 hour
        const timeDiff1 = tx2.created_at.getTime() - tx1.created_at.getTime();
        const timeDiff2 = tx3.created_at.getTime() - tx2.created_at.getTime();
        const totalTime = tx3.created_at.getTime() - tx1.created_at.getTime();
        const totalMinutes = totalTime / (1000 * 60);

        if (totalMinutes <= 60) {
          cyclesDetected++;
          
          if (fastestCycleMinutes === null || totalMinutes < fastestCycleMinutes) {
            fastestCycleMinutes = totalMinutes;
          }
        }
      }
    }

    // Calculate score
    let score = 0;
    if (cyclesDetected >= 6) {
      score = 25;
    } else if (cyclesDetected >= 3) {
      score = 20;
    } else if (cyclesDetected >= 1) {
      score = 10;
    }

    // Bonus points for very fast cycles (< 15 minutes)
    if (fastestCycleMinutes !== null && fastestCycleMinutes < 15) {
      score = Math.min(score + 5, 25);
    }

    return {
      score: Math.min(score, 25),
      cyclesDetected,
      fastestCycleMinutes: fastestCycleMinutes !== null 
        ? Math.round(fastestCycleMinutes * 100) / 100 
        : null
    };
  }

  /**
   * Pattern 4: Circular Tipping Patterns
   * Detects circular patterns: A → B → C → A
   * 
   * Score breakdown:
   * - 0 points: No circular patterns
   * - 10 points: 1-2 circular paths
   * - 20 points: 3-5 circular paths
   * - 25 points: 6+ circular paths or complex networks
   */
  private async detectCircularPatterns(userId: string): Promise<{
    score: number;
    circularPaths: Array<{
      path: string[];
      length: number;
    }>;
  }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get all tips from this user
    const userTips = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        OR: [
          { context_type: 'CONTENT_TIP' },
          { transaction_type: 'CONTENT_TIP' }
        ],
        created_at: { gte: thirtyDaysAgo },
        status: 'COMPLETED',
        counterparty_id: { not: null }
      },
      select: { counterparty_id: true }
    });

    const tippedUsers = [...new Set(userTips.map(t => t.counterparty_id).filter(Boolean))] as string[];

    if (tippedUsers.length === 0) {
      return { score: 0, circularPaths: [] };
    }

    const circularPaths: Array<{ path: string[]; length: number }> = [];

    // Check for 2-hop circles: A → B → A
    for (const userB of tippedUsers) {
      const tipsBackToA = await prisma.transactions.count({
        where: {
          user_id: userB,
          counterparty_id: userId,
          OR: [
            { context_type: 'CONTENT_TIP' },
            { transaction_type: 'CONTENT_TIP' }
          ],
          created_at: { gte: thirtyDaysAgo },
          status: 'COMPLETED'
        }
      });

      if (tipsBackToA > 0) {
        circularPaths.push({
          path: [userId, userB, userId],
          length: 2
        });
      }
    }

    // Check for 3-hop circles: A → B → C → A
    for (const userB of tippedUsers) {
      // Get users that B tips
      const bTips = await prisma.transactions.findMany({
        where: {
          user_id: userB,
          OR: [
            { context_type: 'CONTENT_TIP' },
            { transaction_type: 'CONTENT_TIP' }
          ],
          created_at: { gte: thirtyDaysAgo },
          status: 'COMPLETED',
          AND: [
            { counterparty_id: { not: null } },
            { counterparty_id: { not: userId } } // Exclude direct back-tips (already counted)
          ]
        },
        select: { counterparty_id: true }
      });

      const usersBTipped = [...new Set(bTips.map(t => t.counterparty_id).filter(Boolean))] as string[];

      for (const userC of usersBTipped) {
        // Check if C tips back to A
        const cTipsToA = await prisma.transactions.count({
          where: {
            user_id: userC,
            counterparty_id: userId,
            OR: [
              { context_type: 'CONTENT_TIP' },
              { transaction_type: 'CONTENT_TIP' }
            ],
            created_at: { gte: thirtyDaysAgo },
            status: 'COMPLETED'
          }
        });

        if (cTipsToA > 0) {
          circularPaths.push({
            path: [userId, userB, userC, userId],
            length: 3
          });
        }
      }
    }

    // Calculate score
    let score = 0;
    const pathCount = circularPaths.length;

    if (pathCount >= 6) {
      score = 25;
    } else if (pathCount >= 3) {
      score = 20;
    } else if (pathCount >= 1) {
      score = 10;
    }

    // Bonus for 3-hop circles (more sophisticated laundering)
    const threeHopCount = circularPaths.filter(p => p.length === 3).length;
    if (threeHopCount > 0) {
      score = Math.min(score + 5, 25);
    }

    return {
      score: Math.min(score, 25),
      circularPaths: circularPaths.slice(0, 10) // Limit to first 10 for performance
    };
  }

  /**
   * Flag user if self-tipping score exceeds threshold
   * 
   * @param userId - User ID to flag
   * @param score - Self-tipping score
   * @param patterns - Detection patterns
   */
  async flagUserIfNeeded(
    userId: string,
    score: number,
    patterns: any
  ): Promise<void> {
    if (score > 70) {
      // Update user risk profile
      await prisma.user_risk_profiles.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          risk_score: Math.max(score, 70),
          risk_level: 'CRITICAL',
          self_tipping_score: score,
          withdrawal_blocked: true,
          transaction_limited: true,
          requires_manual_review: true,
          flagged_reasons: ['SELF_TIPPING_DETECTED'],
          last_calculated_at: new Date()
        },
        update: {
          self_tipping_score: score,
          risk_score: Math.max(score, 70),
          risk_level: 'CRITICAL',
          withdrawal_blocked: true,
          transaction_limited: true,
          requires_manual_review: true,
          flagged_reasons: {
            push: 'SELF_TIPPING_DETECTED'
          },
          last_calculated_at: new Date(),
          updated_at: new Date()
        }
      });

      // Log the detection for audit trail
      console.log(`[SELF-TIPPING DETECTED] User ${userId} flagged with score ${score}`, {
        patterns
      });
    }
  }
}

export const selfTippingDetectionService = new SelfTippingDetectionService();
