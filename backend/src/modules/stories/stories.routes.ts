import { Router } from 'express';
import { authMiddleware as requireAuth } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import { StoriesController } from './stories.controller.js';
import { createStorySchema, updateViewerPreferencesSchema } from './stories.validation.js';

export const storiesRoutes = Router();

storiesRoutes.use(requireAuth);

storiesRoutes.post('/', validateRequest(createStorySchema), StoriesController.createStory);
storiesRoutes.get('/feed', StoriesController.getFeed);
storiesRoutes.get('/me', StoriesController.getMyStories);
storiesRoutes.post('/:storyId/view', StoriesController.viewStory);
storiesRoutes.post('/:storyId/tip', StoriesController.tipStory);
storiesRoutes.delete('/:storyId', StoriesController.deleteStory);
storiesRoutes.post('/preferences', validateRequest(updateViewerPreferencesSchema), StoriesController.setViewerPreferences);
