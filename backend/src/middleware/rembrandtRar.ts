import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { prisma } from '../config/database.js';
import { hasPermission, isSuperAdmin } from '../modules/rembrandt-rar/rembrandt-rar.types.js';

export interface RarRequest extends AuthRequest {
  adminRole?: string;
  adminProfileId?: string;
}

/**
 * Middleware: Requires an active admin profile.
 * Loads the admin role from the database and attaches it to the request.
 * Must be used AFTER authMiddleware.
 */
export async function requireRarAccess(req: RarRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const profile = await prisma.adminProfile.findUnique({
      where: { user_id: req.userId },
      select: {
        id: true,
        user_id: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!profile || !profile.is_active) {
      res.status(403).json({ error: 'Access denied: No active admin privileges' });
      return;
    }

    req.adminRole = profile.role;
    req.adminProfileId = profile.id;

    // Update last login timestamp (fire and forget)
    prisma.adminProfile.update({
      where: { id: profile.id },
      data: { last_login_at: new Date() }
    }).catch(() => {});

    next();
  } catch {
    res.status(500).json({ error: 'Admin verification failed' });
  }
}

/**
 * Middleware factory: Requires specific permission(s).
 * Must be used AFTER requireRarAccess.
 */
export function requirePermission(...actions: string[]) {
  return (req: RarRequest, res: Response, next: NextFunction): void => {
    const role = req.adminRole;
    if (!role) {
      res.status(403).json({ error: 'Admin role not resolved' });
      return;
    }

    const allowed = actions.some(action => hasPermission(role, action));
    if (!allowed) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: actions,
        yourRole: role
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: Requires SUPER_ADMIN role specifically.
 * Must be used AFTER requireRarAccess.
 */
export function requireSuperAdmin(req: RarRequest, res: Response, next: NextFunction): void {
  if (!req.adminRole || !isSuperAdmin(req.adminRole)) {
    res.status(403).json({ error: 'Super Admin access required' });
    return;
  }
  next();
}

/**
 * Helper: Log an admin action to the audit trail.
 */
export async function logAuditAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>,
  req?: RarRequest
): Promise<void> {
  try {
    await prisma.audit_logs.create({
      data: {
        performed_by: adminId,
        action_type: action,
        target_user_id: targetId,
        action_details: {
          target_type: targetType,
          target_id: targetId,
          details: details ?? {}
        } as any,
        ip_address: req?.ip ?? req?.headers['x-forwarded-for']?.toString() ?? null,
        user_agent: req?.headers['user-agent']?.toString() ?? null,
      }
    });
  } catch (error) {
    console.error('Audit log write failed:', error);
  }
}

// Alias for compatibility
export const requireRembrandtRar = requireRarAccess;
