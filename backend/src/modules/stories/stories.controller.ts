import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { StoriesService } from './stories.service.js';

export class StoriesController {
  static async createStory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { mediaUrl, mediaType, text, privacy, expiresInHours } = req.body;
      const story = await StoriesService.createStory(userId, mediaUrl, mediaType, text, privacy, expiresInHours);
      res.status(201).json({ success: true, story });
    } catch (error) {
      next(error);
    }
  }

  static async getFeed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const groupedStories = await StoriesService.getFeed(userId);
      res.json({ success: true, feed: groupedStories });
    } catch (error) {
      next(error);
    }
  }

  static async getMyStories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const stories = await StoriesService.getMyStories(userId);
      res.json({ success: true, stories });
    } catch (error) {
      next(error);
    }
  }

  static async viewStory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const storyId = String(req.params.storyId);
      await StoriesService.viewStory(userId, storyId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  static async deleteStory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const storyId = String(req.params.storyId);
      await StoriesService.deleteStory(userId, storyId);
      res.json({ success: true, message: 'Story deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async setViewerPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { preferredViewerIds } = req.body;
      const result = await StoriesService.setViewerPreferences(userId, preferredViewerIds);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
