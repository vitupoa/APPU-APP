import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const JWT_EXPIRES_IN = '15m'; // 15 minutes for access token

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
