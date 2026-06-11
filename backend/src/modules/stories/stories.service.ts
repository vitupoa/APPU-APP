import { prisma } from '../../config/database.js';
import { StoryPrivacy } from '@prisma/client';
import { HashtagService } from '../../shared/hashtag.service.js';
import { WalletService } from '../wallet/wallet.service.js';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

export class StoriesService {
  /**
   * Create a new ephemeral story
   */
  static async createStory(
    creatorId: string,
    media_url: string,
    media_type: string,
    text?: string,
    privacy: StoryPrivacy = StoryPrivacy.PUBLIC,
    expiresInHours: number = 24
  ) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const story = await prisma.story.create({
      data: {
        creator_id: creatorId,
        media_url,
        media_type,
        text,
        privacy,
        expires_at: expiresAt,
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
    const admires = await prisma.admires.findMany({
      where: { admirer_id: userId },
      select: { admired_id: true, is_lovers: true },
    });

    const admiredIds = admires.map((c: any) => c.admired_id);
    const lovedIds = admires.filter((c: any) => c.is_lovers).map((c: any) => c.admired_id);

    // Fetch active stories from these users (or public stories)
    const activeStories = await prisma.story.findMany({
      where: {
        expires_at: { gt: now },
        OR: [
          { creator_id: userId }, // Own stories
          { privacy: StoryPrivacy.PUBLIC },
          {
            privacy: StoryPrivacy.ADMIRERS,
            creator_id: { in: admiredIds },
          },
          {
            privacy: StoryPrivacy.LOVERS,
            creator_id: { in: lovedIds },
          },
          // Specific users logic:
          {
            privacy: StoryPrivacy.SPECIFIC_USERS,
            user: {
              story_viewer_preference: {
                some: { preferredViewerId: userId },
              },
            },
          },
        ],
      },
      include: {
        user: {
          select: { id: true, username: true, display_name: true, avatar_url: true },
        },
        story_view: {
          where: { viewerId: userId },
          select: { id: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Group stories by creator
    const grouped = activeStories.reduce((acc, story) => {
      const creatorId = story.creator_id;
      if (!acc[creatorId]) {
        acc[creatorId] = {
          creator: story.user,
          stories: [],
        };
      }
      
      acc[creatorId].stories.push({
        id: story.id,
        media_url: story.media_url,
        media_type: story.media_type,
        text: story.text,
        created_at: story.created_at,
        expires_at: story.expires_at,
        isViewed: story.story_view.length > 0,
      });

      return acc;
    }, {} as Record<string, any>);

      return {
        feed: Object.values(grouped)
      };
  }

  /**
   * Get user's own active stories with view counts
   */
  static async getMyStories(userId: string) {
    const now = new Date();
    return prisma.story.findMany({
      where: {
        creator_id: userId,
        expires_at: { gt: now },
      },
      include: {
        _count: { select: { story_view: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Mark a story as viewed
   */
  static async viewStory(userId: string, storyId: string) {
    return prisma.story_view.upsert({
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
    amount_kr: number,
    currency: string
  ) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: { user: { select: { id: true, display_name: true } } },
    });

    if (!story) throw new Error('Story not found');
    if (story.creator_id === viewerId) throw new Error('Cannot tip your own story');

    // Execute tip
    const tipResult = await WalletService.sendTip(viewerId, story.creator_id, amount_kr, currency);

    // Update story view with tip info
    await prisma.story_view.upsert({
      where: {
        storyId_viewerId: { storyId, viewerId },
      },
      create: {
        storyId,
        viewerId,
        isTipped: true,
        tip_amount: new Prisma.Decimal(amount_kr),
      },
      update: {
        isTipped: true,
        tip_amount: { increment: new Prisma.Decimal(amount_kr) },
      },
    });

    return {
      success: true,
      tipResult,
      creatorName: story.user.display_name,
    };
  }

  /**
   * Delete a story early
   */
  static async deleteStory(userId: string, storyId: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new Error('Story not found');
    if (story.creator_id !== userId) throw new Error('Not authorized to delete this story');

    return prisma.story.delete({ where: { id: storyId } });
  }

  /**
   * Update preferred viewers for SPECIFIC_USERS privacy
   */
  static async setViewerPreferences(userId: string, preferredViewerIds: string[]) {
    await prisma.story_viewer_preference.deleteMany({
      where: { ownerId: userId },
    });

    if (preferredViewerIds.length > 0) {
      await prisma.story_viewer_preference.createMany({
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
