import { Request, Response, NextFunction } from 'express';

/**
 * Admin middleware - checks if user is an admin
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    return next();
  } catch (error: any) {
    console.error('Error in admin middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
