import { prisma } from '../../config/database.js';

export class RiskScoringService {
  /**
   * Calculate comprehensive risk score for a user (0-100)
   * 
   * Risk Scoring Formula (Requirements 2.3.1):
   * - Profile Risk (30 points): KYC status, account age, email/phone verification
   * - Geographic Risk (20 points): Country risk, IP mismatch, VPN detection
   * - Transaction Risk (30 points): Volume, velocity, large transactions
   * - Behavioral Risk (20 points): Self-tipping, circular patterns, recipient diversity
   * 
   * Risk Levels:
   * - LOW (0-29): Standard monitoring
   * - MEDIUM (30-49): Enhanced monitoring
   * - HIGH (50-69): Require KYC, reduce limits
   * - CRITICAL (70-100): Suspend account, block withdrawals
   */
  async calculateRiskScore(userId: string): Promise<{
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: {
      profile: { score: number; details: any };
      geographic: { score: number; details: any };
      transaction: { score: number; details: any };
      behavioral: { score: number; details: any };
    };
    flags: string[];
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
        transactions: {
          orderBy: { created_at: 'desc' },
          take: 100
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const flags: string[] = [];

    // 1. Profile Risk (30 points max)
    const profileRisk = await this.calculateProfileRisk(user);
    if (profileRisk.score > 20) flags.push('HIGH_PROFILE_RISK');

    // 2. Geographic Risk (20 points max)
    const geoRisk = await this.calculateGeographicRisk(userId, user.country);
    if (geoRisk.score > 10) flags.push('HIGH_RISK_GEOGRAPHY');

    // 3. Transaction Risk (30 points max)
    const transactionRisk = await this.calculateTransactionRisk(userId);
    if (transactionRisk.score > 20) flags.push('HIGH_TRANSACTION_RISK');

    // 4. Behavioral Risk (20 points max)
    const behavioralRisk = await this.calculateBehavioralRisk(userId);
    if (behavioralRisk.score > 15) flags.push('SUSPICIOUS_BEHAVIOR');

    // Calculate total score
    const score = Math.min(
      profileRisk.score + geoRisk.score + transactionRisk.score + behavioralRisk.score,
      100
    );

    // Determine risk level
    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (score >= 70) level = 'CRITICAL';
    else if (score >= 50) level = 'HIGH';
    else if (score >= 30) level = 'MEDIUM';
    else level = 'LOW';

    const factors = {
      profile: { score: profileRisk.score, details: profileRisk.details },
      geographic: { score: geoRisk.score, details: geoRisk.details },
      transaction: { score: transactionRisk.score, details: transactionRisk.details },
      behavioral: { score: behavioralRisk.score, details: behavioralRisk.details }
    };

    // Update or create risk profile
    await this.updateRiskProfile(userId, score, level, factors, flags);

    return { score, level, factors, flags };
  }

  /**
   * Legacy method name for backward compatibility
   */
  async calculateUserRiskScore(userId: string) {
    return this.calculateRiskScore(userId);
  }

  /**
   * Calculate Profile Risk (30 points max)
   * Factors: KYC status (20 pts), account age (5 pts), email/phone verification (5 pts)
   */
  private async calculateProfileRisk(user: any): Promise<{ score: number; details: any }> {
    let score = 0;
    const details: any = {};

    // KYC Status (0-20 points)
    const kycScore = this.calculateKYCRisk(user.kyc_status);
    score += kycScore.score;
    details.kyc = kycScore;

    // Account Age (0-5 points)
    const ageScore = this.calculateAccountAgeRisk(user.created_at);
    score += ageScore.score;
    details.accountAge = ageScore;

    // Email/Phone Verification (0-5 points)
    const verificationScore = this.calculateVerificationRisk(user);
    score += verificationScore.score;
    details.verification = verificationScore;

    return { score: Math.min(score, 30), details };
  }

  /**
   * Calculate Geographic Risk (20 points max)
   * Factors: Country risk (10 pts), IP mismatch (5 pts), VPN detection (5 pts)
   */
  private async calculateGeographicRisk(userId: string, country: string): Promise<{ score: number; details: any }> {
    let score = 0;
    const details: any = { country };

    // High-risk countries (0-10 points)
    // Based on FATF high-risk jurisdictions
    const highRiskCountries = ['KP', 'IR', 'SY', 'MM', 'AF', 'YE'];
    const mediumRiskCountries = ['PK', 'IQ', 'LY', 'SO', 'SD'];

    if (highRiskCountries.includes(country)) {
      score += 10;
      details.countryRisk = 'HIGH';
    } else if (mediumRiskCountries.includes(country)) {
      score += 5;
      details.countryRisk = 'MEDIUM';
    } else {
      details.countryRisk = 'LOW';
    }

    // IP Country Mismatch (0-5 points)
    const ipMismatch = await this.checkIPCountryMismatch(userId, country);
    if (ipMismatch) {
      score += 5;
      details.ipMismatch = true;
    } else {
      details.ipMismatch = false;
    }

    // VPN Detection (0-5 points)
    const vpnDetected = await this.detectVPN(userId);
    if (vpnDetected) {
      score += 5;
      details.vpnDetected = true;
    } else {
      details.vpnDetected = false;
    }

    return { score: Math.min(score, 20), details };
  }

  /**
   * Calculate Transaction Risk (30 points max)
   * Factors: Volume (12 pts), velocity (12 pts), large transactions (6 pts)
   */
  private async calculateTransactionRisk(userId: string): Promise<{ score: number; details: any }> {
    let score = 0;
    const details: any = {};

    // Transaction Volume (0-12 points)
    const volumeRisk = await this.calculateVolumeRisk(userId);
    score += Math.min(volumeRisk.score, 12);
    details.volume = volumeRisk;

    // Transaction Velocity (0-12 points)
    const velocityRisk = await this.calculateVelocityRisk(userId);
    score += Math.min(velocityRisk.score, 12);
    details.velocity = velocityRisk;

    // Large Transactions (0-6 points)
    const largeTransactionsRisk = await this.calculateLargeTransactionsRisk(userId);
    score += Math.min(largeTransactionsRisk.score, 6);
    details.largeTransactions = largeTransactionsRisk;

    return { score: Math.min(score, 30), details };
  }

  /**
   * Calculate Behavioral Risk (20 points max)
   * Factors: Self-tipping (8 pts), circular patterns (8 pts), diversity (4 pts)
   */
  private async calculateBehavioralRisk(userId: string): Promise<{ score: number; details: any }> {
    let score = 0;
    const details: any = {};

    // Self-Tipping Detection (0-8 points)
    const selfTippingRisk = await this.detectSelfTipping(userId);
    score += Math.min(selfTippingRisk.score, 8);
    details.selfTipping = selfTippingRisk;

    // Circular Tipping Detection (0-8 points)
    const circularRisk = await this.detectCircularTipping(userId);
    score += Math.min(circularRisk.score, 8);
    details.circular = circularRisk;

    // Recipient Diversity (0-4 points)
    const diversityRisk = await this.calculateDiversityRisk(userId);
    score += Math.min(diversityRisk.score, 4);
    details.diversity = diversityRisk;

    return { score: Math.min(score, 20), details };
  }

  private calculateKYCRisk(kycStatus: string): { score: number; status: string } {
    switch (kycStatus) {
      case 'NOT_STARTED':
        return { score: 20, status: 'Not started' };
      case 'PENDING':
        return { score: 10, status: 'Pending verification' };
      case 'REJECTED':
        return { score: 20, status: 'Rejected' }; // Same as not started
      case 'APPROVED':
        return { score: 0, status: 'Approved' };
      default:
        return { score: 20, status: 'Unknown' };
    }
  }

  private calculateAccountAgeRisk(createdAt: Date): { score: number; days: number } {
    const ageInDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (ageInDays < 7) return { score: 5, days: ageInDays };
    if (ageInDays < 30) return { score: 3, days: ageInDays };
    if (ageInDays < 90) return { score: 1, days: ageInDays };
    return { score: 0, days: ageInDays };
  }

  private calculateVerificationRisk(user: any): { score: number; emailVerified: boolean; phoneVerified: boolean } {
    let score = 0;
    const emailVerified = user.is_verified || false; // Assuming is_verified means email verified
    const phoneVerified = false; // TODO: Add phone verification field to user model
    
    if (!emailVerified) score += 3;
    if (!phoneVerified) score += 2;
    
    return { score, emailVerified, phoneVerified };
  }

  private async checkIPCountryMismatch(userId: string, userCountry: string): Promise<boolean> {
    // Check recent transactions for IP address
    const recentTransactions = await prisma.transactions.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: { ip_address: true }
    });

    // TODO: Implement IP geolocation check
    // For now, return false (no mismatch detected)
    // In production, use a service like ip-api.com or MaxMind GeoIP
    return false;
  }

  private async detectVPN(userId: string): Promise<boolean> {
    // Check device fingerprints for VPN indicators
    const devices = await prisma.device_fingerprints.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    // TODO: Implement VPN detection logic
    // Check for: WebRTC leaks, timezone mismatches, known VPN IP ranges
    // For now, return false
    return false;
  }

  private async calculateVelocityRisk(userId: string): Promise<{ score: number; count1h: number; count24h: number }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const count1h = await prisma.transactions.count({
      where: {
        user_id: userId,
        created_at: { gte: oneHourAgo }
      }
    });

    const count24h = await prisma.transactions.count({
      where: {
        user_id: userId,
        created_at: { gte: oneDayAgo }
      }
    });

    let score = 0;
    
    // Rapid transactions in 1 hour (0-6 points)
    if (count1h > 50) score += 6;
    else if (count1h > 20) score += 4;
    else if (count1h > 10) score += 2;
    
    // High daily transaction count (0-6 points)
    if (count24h > 200) score += 6;
    else if (count24h > 100) score += 4;
    else if (count24h > 50) score += 2;

    return { score: Math.min(score, 12), count1h, count24h };
  }

  private async calculateVolumeRisk(userId: string): Promise<{ score: number; volume24h: number; volume30d: number }> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result24h = await prisma.transactions.aggregate({
      where: {
        user_id: userId,
        created_at: { gte: oneDayAgo },
        status: 'COMPLETED'
      },
      _sum: { amount_kr: true }
    });

    const result30d = await prisma.transactions.aggregate({
      where: {
        user_id: userId,
        created_at: { gte: thirtyDaysAgo },
        status: 'COMPLETED'
      },
      _sum: { amount_kr: true }
    });

    const volume24h = Number(result24h._sum.amount_kr || 0);
    const volume30d = Number(result30d._sum.amount_kr || 0);

    let score = 0;
    
    // 24-hour volume (0-6 points)
    if (volume24h > 100000) score += 6;
    else if (volume24h > 50000) score += 4;
    else if (volume24h > 20000) score += 2;
    
    // 30-day volume (0-6 points)
    if (volume30d > 500000) score += 6;
    else if (volume30d > 250000) score += 4;
    else if (volume30d > 100000) score += 2;

    return { score: Math.min(score, 12), volume24h, volume30d };
  }

  private async calculateLargeTransactionsRisk(userId: string): Promise<{ score: number; count: number; largestAmount: number }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Count transactions over 10,000 Kr
    const largeTransactions = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        created_at: { gte: thirtyDaysAgo },
        amount_kr: { gte: 10000 },
        status: 'COMPLETED'
      },
      select: { amount_kr: true },
      orderBy: { amount_kr: 'desc' },
      take: 1
    });

    const count = await prisma.transactions.count({
      where: {
        user_id: userId,
        created_at: { gte: thirtyDaysAgo },
        amount_kr: { gte: 10000 },
        status: 'COMPLETED'
      }
    });

    const largestAmount = largeTransactions.length > 0 ? Number(largeTransactions[0].amount_kr) : 0;

    let score = 0;
    
    // Number of large transactions (0-4 points)
    if (count > 10) score += 4;
    else if (count > 5) score += 3;
    else if (count > 2) score += 2;
    
    // Size of largest transaction (0-2 points)
    if (largestAmount > 50000) score += 2;
    else if (largestAmount > 25000) score += 1;

    return { score: Math.min(score, 6), count, largestAmount };
  }

  private async detectSelfTipping(userId: string): Promise<{ score: number; suspicionLevel: string; sharedDeviceUsers: number }> {
    // Check for same device usage across multiple accounts
    const userDevices = await prisma.device_fingerprints.findMany({
      where: { user_id: userId },
      select: { fingerprint_hash: true }
    });

    if (userDevices.length === 0) {
      return { score: 0, suspicionLevel: 'NONE', sharedDeviceUsers: 0 };
    }

    // Check if other users share the same devices
    const sharedDeviceUsers = await prisma.device_fingerprints.findMany({
      where: {
        fingerprint_hash: { in: userDevices.map(d => d.fingerprint_hash) },
        user_id: { not: userId }
      },
      select: { user_id: true }
    });

    const uniqueSharedUsers = [...new Set(sharedDeviceUsers.map(d => d.user_id))];

    // Check if user tips these shared-device users
    const tipsToSharedUsers = await prisma.transactions.count({
      where: {
        user_id: userId,
        context_type: 'CONTENT_TIP',
        counterparty_id: { in: uniqueSharedUsers }
      }
    });

    let score = 0;
    let suspicionLevel = 'NONE';

    if (uniqueSharedUsers.length > 0 && tipsToSharedUsers > 5) {
      score = 8;
      suspicionLevel = 'HIGH';
    } else if (uniqueSharedUsers.length > 0 && tipsToSharedUsers > 0) {
      score = 4;
      suspicionLevel = 'MEDIUM';
    } else if (uniqueSharedUsers.length > 0) {
      score = 2;
      suspicionLevel = 'LOW';
    }

    return { score: Math.min(score, 8), suspicionLevel, sharedDeviceUsers: uniqueSharedUsers.length };
  }

  private async detectCircularTipping(userId: string): Promise<{ score: number; circularPaths: number }> {
    // Detect A→B→C→A patterns
    const userTips = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        context_type: 'CONTENT_TIP'
      },
      select: { counterparty_id: true }
    });

    const tippedUsers = [...new Set(userTips.map(t => t.counterparty_id).filter(Boolean))];

    if (tippedUsers.length === 0) {
      return { score: 0, circularPaths: 0 };
    }

    // Check if any of these users tip back to original user
    const reciprocalTips = await prisma.transactions.count({
      where: {
        user_id: { in: tippedUsers as string[] },
        counterparty_id: userId,
        context_type: 'CONTENT_TIP'
      }
    });

    let score = 0;
    if (reciprocalTips > 10) score = 10;
    else if (reciprocalTips > 5) score = 7;
    else if (reciprocalTips > 2) score = 4;
    else if (reciprocalTips > 0) score = 2;

    return { score: Math.min(score, 10), circularPaths: reciprocalTips };
  }

  private async calculateDiversityRisk(userId: string): Promise<{ score: number; uniqueRecipients: number; totalTips: number; diversityRatio: number }> {
    const tips = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        context_type: 'CONTENT_TIP'
      },
      select: { counterparty_id: true }
    });

    const totalTips = tips.length;
    const uniqueRecipients = new Set(tips.map(t => t.counterparty_id).filter(Boolean)).size;

    if (totalTips === 0) {
      return { score: 0, uniqueRecipients: 0, totalTips: 0, diversityRatio: 1 };
    }

    const diversityRatio = uniqueRecipients / totalTips;

    let score = 0;
    // Low diversity = high risk (tipping same people repeatedly)
    if (diversityRatio < 0.1) score = 5; // Tips same person 90%+ of the time
    else if (diversityRatio < 0.2) score = 3;
    else if (diversityRatio < 0.3) score = 1;

    return { score: Math.min(score, 5), uniqueRecipients, totalTips, diversityRatio };
  }

  private async updateRiskProfile(
    userId: string,
    score: number,
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    factors: any,
    flags: string[]
  ): Promise<void> {
    await prisma.user_risk_profiles.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        risk_score: score,
        risk_level: level,
        kyc_risk_score: factors.profile?.score || 0,
        geographic_risk_score: factors.geographic?.score || 0,
        transaction_risk_score: factors.transaction?.score || 0,
        behavioral_risk_score: factors.behavioral?.score || 0,
        self_tipping_score: factors.behavioral?.details?.selfTipping?.score || 0,
        circular_tipping_score: factors.behavioral?.details?.circular?.score || 0,
        recipient_diversity: factors.behavioral?.details?.diversity?.uniqueRecipients || 0,
        withdrawal_blocked: level === 'CRITICAL',
        transaction_limited: level === 'HIGH' || level === 'CRITICAL',
        requires_manual_review: level === 'HIGH' || level === 'CRITICAL',
        flagged_reasons: flags,
        last_calculated_at: new Date()
      },
      update: {
        risk_score: score,
        risk_level: level,
        kyc_risk_score: factors.profile?.score || 0,
        geographic_risk_score: factors.geographic?.score || 0,
        transaction_risk_score: factors.transaction?.score || 0,
        behavioral_risk_score: factors.behavioral?.score || 0,
        self_tipping_score: factors.behavioral?.details?.selfTipping?.score || 0,
        circular_tipping_score: factors.behavioral?.details?.circular?.score || 0,
        recipient_diversity: factors.behavioral?.details?.diversity?.uniqueRecipients || 0,
        withdrawal_blocked: level === 'CRITICAL',
        transaction_limited: level === 'HIGH' || level === 'CRITICAL',
        requires_manual_review: level === 'HIGH' || level === 'CRITICAL',
        flagged_reasons: flags,
        last_calculated_at: new Date(),
        updated_at: new Date()
      }
    });
  }

  /**
   * Get user's current risk profile
   */
  async getUserRiskProfile(userId: string) {
    let profile = await prisma.user_risk_profiles.findUnique({
      where: { user_id: userId }
    });

    // If no profile exists or it's stale (>24 hours), recalculate
    if (!profile || (Date.now() - profile.last_calculated_at.getTime()) > 24 * 60 * 60 * 1000) {
      const riskData = await this.calculateUserRiskScore(userId);
      profile = await prisma.user_risk_profiles.findUnique({
        where: { user_id: userId }
      });
    }

    return profile;
  }
}

export const riskScoringService = new RiskScoringService();
