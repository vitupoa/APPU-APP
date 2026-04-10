import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').regex(/^[A-Za-z\-']+$/, 'First name can only contain letters, hyphens, and apostrophes'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').regex(/^[A-Za-z\-']+$/, 'Last name can only contain letters, hyphens, and apostrophes'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  phone: z.string().optional(),
  accountType: z.enum(['CREATOR', 'BUSINESS']).default('CREATOR'),
  country: z.string().length(2, 'Country must be a 2-letter ISO code'),
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code'),
  deviceId: z.string().min(1, 'Device ID is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  username: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
}).refine(data => data.email || data.phone || data.username, {
  message: "Either email, phone, or username must be provided",
});

// For OAuth signup/login (Google/Apple)
export const oauthSchema = z.object({
  provider: z.enum(['google', 'apple']),
  token: z.string().min(1, 'OAuth token is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
  // If it's a first time OAuth signup, these are required:
  country: z.string().length(2).optional(),
  currency: z.string().length(3).optional(),
  accountType: z.enum(['CREATOR', 'BUSINESS']).optional(),
  // For OAuth, we'll suggest usernames if missing, but they can provide one
  username: z.string().min(3).regex(/^[a-z0-9_]+$/).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
});

export const checkUsernameSchema = z.object({
  username: z.string().min(3).regex(/^[a-z0-9_]+$/),
});
