import { prisma } from '../../config/database.js';
import { StoryPrivacy } from '@prisma/client';
import { HashtagService } from '../../shared/hashtag.service.js';
import { WalletService } from '../wallet/wallet.service.js';
import { Prisma } from '@prisma/client';

export class StoriesService {
  /**
   * Create a new ephemeral story
   */
  static async createStory(
    creatorId: string,
    mediaUrl: string,
    mediaType: string,
    text?: string,
    privacy: StoryPrivacy = StoryPrivacy.PUBLIC,
    expiresInHours: number = 24
  ) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const story = await prisma.story.create({
      data: {
        creatorId,
        mediaUrl,
        mediaType,
        text,
        privacy,
        expiresAt,
      },
    });

    if (text) {
      await HashtagService.processMentions(story.id, 'SHORT', text); // Using SHORT enum temporarily or add STORY if needed
    }

    return story;
  }

  /**
   * Fetch active stories for a user based on their social graph and privacy settings
   */
  static async getFeed(userId: string) {
    const now = new Date();

    // Find who the user admires and loves
    const admires = await prisma.admire.findMany({
      where: { admirerId: userId },
      select: { admiredId: true, isLovers: true },
    });

    const admiredIds = admires.map((c: any) => c.admiredId);
    const lovedIds = admires.filter((c: any) => c.isLovers).map((c: any) => c.admiredId);

    // Fetch active stories from these users (or public stories)
    const activeStories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        OR: [
          { creatorId: userId }, // Own stories
          { privacy: StoryPrivacy.PUBLIC },
          {
            privacy: StoryPrivacy.ADMIRERS,
            creatorId: { in: admiredIds },
          },
          {
            privacy: StoryPrivacy.LOVERS,
            creatorId: { in: lovedIds },
          },
          // Specific users logic:
          {
            privacy: StoryPrivacy.SPECIFIC_USERS,
            creator: {
              storyViewerPreferences: {
                some: { preferredViewerId: userId },
              },
            },
          },
        ],
      },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        views: {
          where: { viewerId: userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group stories by creator
    const grouped = activeStories.reduce((acc, story) => {
      const creatorId = story.creatorId;
      if (!acc[creatorId]) {
        acc[creatorId] = {
          creator: story.creator,
          stories: [],
        };
      }
      
      acc[creatorId].stories.push({
        id: story.id,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        text: story.text,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        isViewed: story.views.length > 0,
      });

      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  }

  /**
   * Get user's own active stories with view counts
   */
  static async getMyStories(userId: string) {
    const now = new Date();
    return prisma.story.findMany({
      where: {
        creatorId: userId,
        expiresAt: { gt: now },
      },
      include: {
        _count: { select: { views: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mark a story as viewed
   */
  static async viewStory(userId: string, storyId: string) {
    return prisma.storyView.upsert({
      where: {
        storyId_viewerId: { storyId, viewerId: userId },
      },
      create: { storyId, viewerId: userId },
      update: { viewedAt: new Date() },
    });
  }

  /**
   * Tip a story creator.
   */
  static async tipStory(
    viewerId: string,
    storyId: string,
    amountKr: number,
    currency: string
  ) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: { creator: { select: { id: true, displayName: true } } },
    });

    if (!story) throw new Error('Story not found');
    if (story.creatorId === viewerId) throw new Error('Cannot tip your own story');

    // Execute tip
    const tipResult = await WalletService.sendTip(viewerId, story.creatorId, amountKr, currency);

    // Update story view with tip info
    await prisma.storyView.upsert({
      where: {
        storyId_viewerId: { storyId, viewerId },
      },
      create: {
        storyId,
        viewerId,
        isTipped: true,
        tipAmount: new Prisma.Decimal(amountKr),
      },
      update: {
        isTipped: true,
        tipAmount: { increment: new Prisma.Decimal(amountKr) },
      },
    });

    return {
      success: true,
      tipResult,
      creatorName: story.creator.displayName,
    };
  }

  /**
   * Delete a story early
   */
  static async deleteStory(userId: string, storyId: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new Error('Story not found');
    if (story.creatorId !== userId) throw new Error('Not authorized to delete this story');

    return prisma.story.delete({ where: { id: storyId } });
  }

  /**
   * Update preferred viewers for SPECIFIC_USERS privacy
   */
  static async setViewerPreferences(userId: string, preferredViewerIds: string[]) {
    await prisma.storyViewerPreference.deleteMany({
      where: { ownerId: userId },
    });

    if (preferredViewerIds.length > 0) {
      await prisma.storyViewerPreference.createMany({
        data: preferredViewerIds.map((id: any) => ({
          ownerId: userId,
          preferredViewerId: id,
        })),
        skipDuplicates: true,
      });
    }

    return { success: true };
  }
}
