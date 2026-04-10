"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.adminAuth = adminAuth;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
/**
 * JWT authentication middleware.
 * Verifies the access token from the Authorization header.
 * Attaches userId and deviceId to the request object.
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
        req.userId = decoded.userId;
        req.deviceId = decoded.deviceId;
        req.isAdmin = decoded.isAdmin;
        req.isWalletUnlocked = decoded.isWalletUnlocked;
        req.accountType = decoded.accountType;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
            return;
        }
        res.status(500).json({ error: 'Authentication failed' });
    }
}
/**
 * Admin authentication middleware.
 * Must be used AFTER authMiddleware.
 */
function adminAuth(req, res, next) {
    if (!req.isAdmin) {
        res.status(403).json({ error: 'Forbidden: Requires admin privileges' });
        return;
    }
    next();
}
/**
 * Optional auth — doesn't fail if no token, but attaches userId if present.
 * Used for public endpoints that show extra data for authenticated users.
 */
function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
            req.userId = decoded.userId;
            req.deviceId = decoded.deviceId;
        }
        catch {
            // Silently continue — user is unauthenticated
        }
    }
    next();
}
//# sourceMappingURL=auth.js.map