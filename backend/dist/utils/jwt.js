import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
const JWT_EXPIRES_IN = '15m'; // 15 minutes for access token
export const generateAccessToken = (payload) => {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
export const verifyAccessToken = (token) => {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
};
//# sourceMappingURL=jwt.js.map