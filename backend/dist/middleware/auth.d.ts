import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    userId?: string;
    deviceId?: string;
    isAdmin?: boolean;
    isWalletUnlocked?: boolean;
    accountType?: 'CREATOR' | 'BUSINESS';
}
export interface JwtPayload {
    userId: string;
    deviceId: string;
    isAdmin: boolean;
    isWalletUnlocked: boolean;
    accountType: 'CREATOR' | 'BUSINESS';
    iat: number;
    exp: number;
}
/**
 * JWT authentication middleware.
 * Verifies the access token from the Authorization header.
 * Attaches userId and deviceId to the request object.
 */
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void;
/**
 * Admin authentication middleware.
 * Must be used AFTER authMiddleware.
 */
export declare function adminAuth(req: AuthRequest, res: Response, next: NextFunction): void;
/**
 * Optional auth — doesn't fail if no token, but attaches userId if present.
 * Used for public endpoints that show extra data for authenticated users.
 */
export declare function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map