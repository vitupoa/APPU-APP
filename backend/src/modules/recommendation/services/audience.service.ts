import { prisma } from '../../../config/database.js';
import { RecommendationAlgorithm } from './algorithm.service.js';

export class AudienceSelectionService {
  
  /**
   * Get initial test audience for new content (2K users: 1K local + 1K global)
   */
  static async getInitialTestAudience(
    creatorId: string,
    contentId: string,
    location?: string,
    hashtags: string[] = []
  ): Promise<string[]> {
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { admirersCount: true, country: true }
    });

    if (!creator) return [];

    const testAudienceSize = 2000;
    const localSize = 1000;
    const globalSize = 1000;

    // Get creator's admirers (30% of test audience)
    const admirers = await this.getCreatorAdmirers(creatorId, Math.floor(testAudienceSize * 0.3));

    // Get users with similar interests (40% of test audience)
    const similarInterests = await this.getUsersWithSimilarInterests(
      hashtags,
      Math.floor(testAudienceSize * 0.4)
    );

    // Get demographic match - split between local and global
    const localDemographic = await this.getDemographicMatch(
      creator.country,
      true,
      Math.floor(localSize * 0.2)
    );

    const globalDemographic = await this.getDemographicMatch(
      creator.country,
      false,
      Math.floor(globalSize * 0.2)
    );

    // Get random users - split between local and global
    const localRandom = await this.getRandomUsers(
      creator.country,
      true,
      Math.floor(localSize * 0.1)
    );

    const globalRandom = await this.getRandomUsers(
      creator.country,
      false,
      Math.floor(globalSize * 0.1)
    );

    // Combine all audiences and remove duplicates
    const allUsers = [
      ...admirers,
      ...similarInterests,
      ...localDemographic,
      ...globalDemographic,
      ...localRandom,
      ...globalRandom
    ];

    const uniqueUsers = [...new Set(allUsers)];
    
    // Shuffle to randomize delivery order
    return this.shuffleArray(uniqueUsers).slice(0, testAudienceSize);
  }

  /**
   * Get creator's admirers
   */
  private static async getCreatorAdmirers(creatorId: string, limit: number): Promise<string[]> {
    const admirers = await prisma.admire.findMany({
      where: { admiredId: creatorId },
      select: { admirerId: true },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return admirers.map((a: any) => a.admirerId);
  }

  /**
   * Get users with similar interests based on hashtags
   */
  private static async getUsersWithSimilarInterests(
    hashtags: string[],
    limit: number
  ): Promise<string[]> {
    if (hashtags.length === 0) return [];

    // Find users who recently engaged with similar hashtags
    const users = await prisma.$queryRaw<Array<{ user_id: string }>>`
      SELECT DISTINCT sl.user_id
      FROM short_likes sl
      INNER JOIN shorts s ON sl.short_id = s.id
      WHERE s.caption ILIKE ANY(ARRAY[${hashtags.map((tag: any) => `%${tag}%`)}])
      ORDER BY sl.created_at DESC
      LIMIT ${limit}
    `;

    return users.map((u: any) => u.user_id);
  }

  /**
   * Get demographic match (age, location)
   */
  private static async getDemographicMatch(
    country: string,
    isLocal: boolean,
    limit: number
  ): Promise<string[]> {
    const users = await prisma.user.findMany({
      where: isLocal ? { country } : { country: { not: country } },
      select: { id: true },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return users.map((u: any) => u.id);
  }

  /**
   * Get random users for exploration
   */
  private static async getRandomUsers(
    country: string,
    isLocal: boolean,
    limit: number
  ): Promise<string[]> {
    // Use random sampling
    const users = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM users
      WHERE country ${isLocal ? '=' : '!='} ${country}
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;

    return users.map((u: any) => u.id);
  }

  /**
   * Get next tier audience based on performance
   */
  static async getNextTierAudience(
    contentId: string,
    contentType: 'SHORT' | 'POST',
    currentTier: number,
    previousAudience: string[]
  ): Promise<string[]> {
    const nextTierSize = RecommendationAlgorithm.getNextTierAudienceSize(currentTier);
    
    // Get content details
    const content = contentType === 'SHORT'
      ? await prisma.short.findUnique({ where: { id: contentId }, select: { caption: true, userId: true } })
      : await prisma.post.findUnique({ where: { id: contentId }, select: { caption: true, userId: true } });

    if (!content) return [];

    // Extract hashtags from caption
    const hashtags = this.extractHashtags(content.caption || '');

    // Get users who engaged positively with similar content
    const engagedUsers = await this.getUsersEngagedWithSimilarContent(hashtags, nextTierSize);

    // Exclude users who already saw it
    const newAudience = engagedUsers.filter((userId: any) => !previousAudience.includes(userId));

    return this.shuffleArray(newAudience).slice(0, nextTierSize);
  }

  /**
   * Get users who engaged with similar content
   */
  private static async getUsersEngagedWithSimilarContent(
    hashtags: string[],
    limit: number
  ): Promise<string[]> {
    if (hashtags.length === 0) return [];

    const users = await prisma.$queryRaw<Array<{ user_id: string }>>`
      SELECT DISTINCT sl.user_id
      FROM short_likes sl
      INNER JOIN shorts s ON sl.short_id = s.id
      WHERE s.caption ILIKE ANY(ARRAY[${hashtags.map((tag: any) => `%${tag}%`)}])
      ORDER BY sl.created_at DESC
      LIMIT ${limit}
    `;

    return users.map((u: any) => u.user_id);
  }

  /**
   * Extract hashtags from text
   */
  private static extractHashtags(text: string): string[] {
    const regex = /#([a-zA-Z0-9_]+)/g;
    const matches = text.match(regex);
    return matches ? matches.map((tag: any) => tag.toLowerCase()) : [];
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
