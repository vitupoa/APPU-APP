import { z } from 'zod';

export const createDirectChatSchema = z.object({
  body: z.object({
    recipientId: z.string().uuid('Invalid recipient ID'),
  }),
});

export const createGroupChatSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    participantIds: z.array(z.string().uuid()).min(1).max(1000),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    payload: z.string().min(1, 'Message cannot be empty'),
    mediaUrl: z.string().url().optional(),
    mediaType: z.enum(['image', 'video', 'document', 'voice']).optional(),
    replyToId: z.string().uuid().optional(),
  }),
});

export const updateGroupChatSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    avatarUrl: z.string().url().optional().nullable(),
  }),
});

export const manageMemberSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    action: z.enum(['promote', 'demote', 'kick']),
  }),
});

export const transferOwnershipSchema = z.object({
  body: z.object({
    newOwnerId: z.string().uuid('Invalid user ID'),
  }),
});
