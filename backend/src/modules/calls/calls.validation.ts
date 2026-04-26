import { z } from 'zod';

export const initiateCallSchema = z.object({
  chatId: z.string().uuid(),
  type: z.enum(['VOICE', 'VIDEO']),
});

export const callActionSchema = z.object({
  callId: z.string().uuid(),
});
