import { prisma } from '../../config/database.js';
import axios from 'axios';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('OFACScreening');

export class OFACScreeningService {
  private sdnListUrl = process.env.OFAC_LIST_URL || 'https://www.treasury.gov/ofac/downloads/sdnlist.txt';
  private sdnList: string[] = [];
  private lastUpdated: Date | null = null;

  /**
   * Download and parse OFAC SDN list
   */
  async updateSDNList(): Promise<void> {
    try {
      logger.info('Downloading OFAC SDN list...');
      
      const response = await axios.get(this.sdnListUrl, {
        timeout: 30000
      });

      // Parse the SDN list (simplified - actual format is more complex)
      const lines = response.data.split('\n');
      this.sdnList = lines
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => this.normalizeName(line));

      this.lastUpdated = new Date();
      
      logger.info(`OFAC SDN list updated: ${this.sdnList.length} entries`);
    } catch (error) {
      logger.error('Failed to update OFAC SDN list:', error as any);
      throw error;
    }
  }

  /**
   * Check if name matches OFAC SDN list
   */
  async screenName(name: string): Promise<{
    isMatch: boolean;
    matchScore: number;
    matchedEntry: string | null;
  }> {
    const normalizedName = this.normalizeName(name);

    // Check cache first
    const cached = await prisma.ofac_screening_cache.findUnique({
      where: { name_normalized: normalizedName }
    });

    if (cached && cached.expires_at > new Date()) {
      return {
        isMatch: cached.is_match,
        matchScore: cached.match_score || 0,
        matchedEntry: cached.matched_entry
      };
    }

    // Ensure SDN list is loaded
    if (this.sdnList.length === 0 || !this.lastUpdated || 
        (Date.now() - this.lastUpdated.getTime()) > 7 * 24 * 60 * 60 * 1000) {
      await this.updateSDNList();
    }

    // Perform screening
    const result = this.matchAgainstSDN(normalizedName);

    // Cache result (expires in 7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.ofac_screening_cache.upsert({
      where: { name_normalized: normalizedName },
      create: {
        name: name,
        name_normalized: normalizedName,
        is_match: result.isMatch,
        match_score: result.matchScore,
        matched_entry: result.matchedEntry,
        checked_at: new Date(),
        list_version: this.lastUpdated?.toISOString(),
        expires_at: expiresAt
      },
      update: {
        is_match: result.isMatch,
        match_score: result.matchScore,
        matched_entry: result.matchedEntry,
        checked_at: new Date(),
        list_version: this.lastUpdated?.toISOString(),
        expires_at: expiresAt
      }
    });

    return result;
  }

  /**
   * Match name against SDN list
   */
  private matchAgainstSDN(normalizedName: string): {
    isMatch: boolean;
    matchScore: number;
    matchedEntry: string | null;
  } {
    let bestMatch = 0;
    let matchedEntry: string | null = null;

    for (const sdnEntry of this.sdnList) {
      const score = this.calculateSimilarity(normalizedName, sdnEntry);
      
      if (score > bestMatch) {
        bestMatch = score;
        matchedEntry = sdnEntry;
      }

      // Exact match or very high similarity
      if (score >= 95) {
        return {
          isMatch: true,
          matchScore: score,
          matchedEntry: sdnEntry
        };
      }
    }

    // Consider it a match if similarity > 85%
    return {
      isMatch: bestMatch >= 85,
      matchScore: bestMatch,
      matchedEntry: bestMatch >= 85 ? matchedEntry : null
    };
  }

  /**
   * Normalize name for comparison
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Calculate similarity between two strings (Levenshtein distance)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    const similarity = ((maxLen - distance) / maxLen) * 100;

    return Math.round(similarity);
  }

  /**
   * Screen user (name from KYC documents)
   */
  async screenUser(userId: string): Promise<{
    isBlocked: boolean;
    reason: string | null;
    matchDetails: any;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        first_name: true,
        last_name: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const fullName = `${user.first_name} ${user.last_name}`;
    const screeningResult = await this.screenName(fullName);

    if (screeningResult.isMatch) {
      // Log the match
      await prisma.suspicious_activity_logs.create({
        data: {
          user_id: userId,
          activityType: 'OFAC_MATCH',
          description: `Name matches OFAC SDN list: ${screeningResult.matchedEntry}`,
          severity: 'CRITICAL',
          metadata: {
            matchScore: screeningResult.matchScore,
            matchedEntry: screeningResult.matchedEntry
          }
        }
      });

      return {
        isBlocked: true,
        reason: 'Name matches OFAC sanctions list',
        matchDetails: screeningResult
      };
    }

    return {
      isBlocked: false,
      reason: null,
      matchDetails: screeningResult
    };
  }

  /**
   * Initialize service (load SDN list on startup)
   */
  async initialize(): Promise<void> {
    try {
      await this.updateSDNList();
      logger.info('OFAC screening service initialized');
    } catch (error) {
      logger.error('Failed to initialize OFAC screening service:', error as any);
      // Don't throw - service can still work with cached data
    }
  }
}

export const ofacScreeningService = new OFACScreeningService();

