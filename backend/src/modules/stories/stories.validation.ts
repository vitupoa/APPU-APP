import { z } from 'zod';
import { StoryPrivacy } from '@prisma/client';

export const createStorySchema = z.object({
  body: z.object({
    media_url: z.string().url('Invalid media URL').min(1, 'Media URL is required'),
    media_type: z.enum(['image', 'video', 'text']),
    text: z.string().optional(),
    privacy: z.nativeEnum(StoryPrivacy).optional().default(StoryPrivacy.PUBLIC),
    expiresInHours: z.number().int().min(1).max(168).optional().default(24), // 1 hour to 1 week
  }),
});

export const updateViewerPreferencesSchema = z.object({
  body: z.object({
    preferredViewerIds: z.array(z.string().uuid()),
  }),
});
