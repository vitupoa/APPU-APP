import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayload {
  userId: string;
  role?: string;
  isWalletUnlocked: boolean;
  isAdmin: boolean;
  deviceId: string;
  accountType: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  // Use environment variable or default to 30 days for persistent login like WhatsApp/TikTok
  const expiresIn = env.JWT_ACCESS_EXPIRY || '30d';
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
};

export const verifyToken = verifyAccessToken;
