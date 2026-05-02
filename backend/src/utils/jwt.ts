import jwt, { SignOptions } from 'jsonwebtoken';
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
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: (env.JWT_ACCESS_EXPIRY || '30d') as string });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
};

export const verifyToken = verifyAccessToken;
