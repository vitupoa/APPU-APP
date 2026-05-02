import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Use environment variable or default to 30 days for persistent login like WhatsApp/TikTok
const JWT_EXPIRES_IN = env.JWT_ACCESS_EXPIRY || '30d';

export interface JwtPayload {
  userId: string;
  role?: string;
  isWalletUnlocked: boolean;
  isAdmin: boolean;
  deviceId: string;
  accountType: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
};

export const verifyToken = verifyAccessToken;
