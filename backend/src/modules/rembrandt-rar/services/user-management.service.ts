import { prisma } from '../../../config/database.js';
import { AuditService } from './audit.service.js';
import { ADMIN_ACTIONS } from '../rembrandt-rar.types.js';
import { EmailService } from '../../../shared/services/email.service.js';
import crypto from 'crypto';

export class UserManagementService {
  static async listUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    accountType?: string;
    isSuspended?: boolean;
    isVerified?: boolean;
  }) {
    const { page = 1, limit = 20, search, sort = 'createdAt', order = 'desc', accountType, isSuspended, isVerified } = options;
    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { display_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (accountType) where.account_type = accountType;
    if (isSuspended !== undefined) where.isSuspended = isSuspended;
    if (isVerified !== undefined) where.is_verified = isVerified;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, username: true, email: true, first_name: true, last_name: true,
          display_name: true, avatar_url: true, country: true, currency: true,
          account_type: true, is_admin: true, is_verified: true, isSuspended: true,
          is_wallet_unlocked: true, created_at: true, updated_at: true,
          _count: { select: { shorts: true, Post: true } },
          adminProfile: { select: { role: true, is_active: true } },
        },
        orderBy: { [sort]: order },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { items: users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getUserDetail(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        wallets: { select: { kr_balance: true } },
        adminProfile: true,
        suspensions: { orderBy: { created_at: 'desc' }, take: 5 },
        _count: {
          select: {
            shorts: true, Post: true, Contest: true,
            admires_admires_admired_idToUser: true,
            admires_admires_admirer_idToUser: true,
            transactions: true, stories: true,
          }
        },
      }
    });
    return user;
  }

  static async suspendUser(
    adminId: string, targetUserId: string,
    data: { reason: string; type: 'SUSPENDED' | 'BANNED' | 'BLOCKED'; expiresAt?: string },
    ip?: string, ua?: string
  ) {
    // Prevent self-suspension
    if (adminId === targetUserId) throw new Error('Cannot suspend yourself');

    // Prevent suspending another super admin
    const targetProfile = await prisma.admin_profile.findUnique({ where: { user_id: targetUserId } });
    if (targetProfile?.role === 'SUPER_ADMIN') {
      throw new Error('Cannot suspend a Super Admin');
    }

    return prisma.$transaction(async (tx) => {
      await tx.user_suspensions.create({
        data: {
          user_id: targetUserId,
          reason: data.reason,
          suspendedBy: adminId,
          type: data.type,
          expires_at: data.expiresAt ? new Date(data.expiresAt) : null,
        }
      });

      await tx.user.update({
        where: { id: targetUserId },
        data: { isSuspended: true, suspendedAt: new Date() }
      });

      await AuditService.log(adminId, ADMIN_ACTIONS.USER_SUSPEND, 'user', targetUserId, {
        reason: data.reason, type: data.type, expires_at: data.expiresAt
      }, ip, ua);

      return { success: true, message: `User ${data.type.toLowerCase()} successfully` };
    });
  }

  static async unsuspendUser(adminId: string, targetUserId: string, ip?: string, ua?: string) {
    return prisma.$transaction(async (tx) => {
      // Lift active suspensions
      await tx.user_suspensions.updateMany({
        where: { user_id: targetUserId, liftedAt: null },
        data: { liftedAt: new Date(), liftedBy: adminId }
      });

      await tx.user.update({
        where: { id: targetUserId },
        data: { isSuspended: false, suspendedAt: null }
      });

      await AuditService.log(adminId, ADMIN_ACTIONS.USER_UNSUSPEND, 'user', targetUserId, {}, ip, ua);
      return { success: true, message: 'User unsuspended' };
    });
  }

  static async verifyUser(adminId: string, targetUserId: string, ip?: string, ua?: string) {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { is_verified: true }
    });
    await AuditService.log(adminId, ADMIN_ACTIONS.USER_VERIFY, 'user', targetUserId, {}, ip, ua);
    return { success: true, message: 'User verified' };
  }

  static async deleteUser(adminId: string, targetUserId: string, ip?: string, ua?: string) {
    if (adminId === targetUserId) throw new Error('Cannot delete yourself');

    const targetProfile = await prisma.admin_profile.findUnique({ where: { user_id: targetUserId } });
    if (targetProfile?.role === 'SUPER_ADMIN') {
      throw new Error('Cannot delete a Super Admin');
    }

    await AuditService.log(adminId, ADMIN_ACTIONS.USER_DELETE, 'user', targetUserId, {}, ip, ua);
    await prisma.user.delete({ where: { id: targetUserId } });
    return { success: true, message: 'User deleted' };
  }

  static async assignRole(
    adminId: string, targetUserId: string,
    data: { role: string; permissions?: Record<string, boolean> },
    ip?: string, ua?: string
  ) {
    // Only super admins can assign roles
    const adminProfile = await prisma.admin_profile.findUnique({ where: { user_id: adminId } });
    if (adminProfile?.role !== 'SUPER_ADMIN') {
      throw new Error('Only Super Admins can assign roles');
    }

    // Self-protection: can't remove own SUPER_ADMIN if last one
    if (adminId === targetUserId && data.role !== 'SUPER_ADMIN') {
      const superAdminCount = await prisma.admin_profile.count({
        where: { role: 'SUPER_ADMIN', is_active: true }
      });
      if (superAdminCount <= 1) {
        throw new Error('Cannot remove last Super Admin role');
      }
    }

    const existing = await prisma.admin_profile.findUnique({ where: { user_id: targetUserId } });

    if (existing) {
      await prisma.admin_profile.update({
        where: { id: existing.id },
        data: { role: data.role as any, is_active: true }
      });
    } else {
      await prisma.admin_profile.create({
        data: {
          user_id: targetUserId,
          role: data.role as any,
          granted_by: adminId,
        }
      });
    }

    await prisma.user.update({ where: { id: targetUserId }, data: { is_admin: true } });
    await AuditService.log(adminId, ADMIN_ACTIONS.USER_ROLE_ASSIGN, 'user', targetUserId, { role: data.role }, ip, ua);
    return { success: true, message: `Role ${data.role} assigned` };
  }

  static async revokeRole(adminId: string, targetUserId: string, ip?: string, ua?: string) {
    if (adminId === targetUserId) {
      const superAdminCount = await prisma.admin_profile.count({
        where: { role: 'SUPER_ADMIN', is_active: true }
      });
      if (superAdminCount <= 1) {
        throw new Error('Cannot revoke last Super Admin');
      }
    }

    const targetProfile = await prisma.admin_profile.findUnique({ where: { user_id: targetUserId } });
    if (!targetProfile) throw new Error('User has no admin role');

    // Non-super-admins can't revoke super admin
    const adminSelf = await prisma.admin_profile.findUnique({ where: { user_id: adminId } });
    if (targetProfile.role === 'SUPER_ADMIN' && adminSelf?.role !== 'SUPER_ADMIN') {
      throw new Error('Cannot revoke Super Admin role');
    }

    await prisma.admin_profile.update({
      where: { id: targetProfile.id },
      data: { is_active: false }
    });
    await prisma.user.update({ where: { id: targetUserId }, data: { is_admin: false } });
    await AuditService.log(adminId, ADMIN_ACTIONS.USER_ROLE_REVOKE, 'user', targetUserId, {}, ip, ua);
    return { success: true, message: 'Admin role revoked' };
  }

  static async changeUserName(
    adminId: string, targetUserId: string,
    data: { firstName?: string; lastName?: string; displayName?: string; username?: string },
    ip?: string, ua?: string
  ) {
    const updateData: any = {};
    if (data.firstName) updateData.first_name = data.firstName;
    if (data.lastName) updateData.last_name = data.lastName;
    if (data.displayName) updateData.display_name = data.displayName;
    if (data.username) {
      // Check prohibited
      const prohibited = await prisma.prohibited_names.findFirst({
        where: { name: data.username.toLowerCase() }
      });
      if (prohibited) throw new Error(`Username "${data.username}" is prohibited: ${prohibited.reason}`);

      // Check reserved
      const reserved = await prisma.reserved_usernames.findFirst({
        where: { username: data.username.toLowerCase(), reserved_for: { not: targetUserId } }
      });
      if (reserved) throw new Error(`Username "${data.username}" is reserved`);

      updateData.username = data.username;
    }

    await prisma.user.update({ where: { id: targetUserId }, data: updateData });
    await AuditService.log(adminId, ADMIN_ACTIONS.USER_NAME_CHANGE, 'user', targetUserId, data, ip, ua);
    return { success: true, message: 'User name updated by admin' };
  }

  static async resetUserPassword(adminId: string, targetUserId: string, ip?: string, ua?: string) {
    // Generate a temporary password
    const tempPassword = `Krieta_${Math.random().toString(36).substring(2, 10)}!`;
    const hash = await (await import('bcrypt')).hash(tempPassword, 12);

    const user = await prisma.user.update({ where: { id: targetUserId }, data: { password_hash: hash } });
    // Revoke all refresh tokens to force re-login
    await prisma.refresh_tokens.deleteMany({ where: { user_id: targetUserId } });

    await AuditService.log(adminId, ADMIN_ACTIONS.USER_RESET_PASSWORD, 'user', targetUserId, {}, ip, ua);
    
    // Send email to user
    await EmailService.sendPasswordResetEmail(user.email, tempPassword).catch(e => {
      console.error('Failed to send password reset email:', e);
    });

    return { success: true, tempPassword, message: 'Password reset. Email sent to user.' };
  }

  static async changeUserPassword(adminId: string, targetUserId: string, newPassword: string, ip?: string, ua?: string) {
    const hash = await (await import('bcrypt')).hash(newPassword, 12);
    await prisma.user.update({ where: { id: targetUserId }, data: { password_hash: hash } });
    await prisma.refresh_tokens.deleteMany({ where: { user_id: targetUserId } });
    await AuditService.log(adminId, ADMIN_ACTIONS.USER_RESET_PASSWORD, 'user', targetUserId, { method: 'manual' }, ip, ua);
    return { success: true, message: 'Password changed successfully.' };
  }

  static async updateUserProfile(
    adminId: string, targetUserId: string,
    data: { bio?: string; country?: string; currency?: string; accountType?: string },
    ip?: string, ua?: string
  ) {
    const updateData: any = { ...data };
    if (data.accountType) updateData.account_type = data.accountType;

    await prisma.user.update({ where: { id: targetUserId }, data: updateData });
    await AuditService.log(adminId, ADMIN_ACTIONS.USER_NAME_CHANGE, 'user', targetUserId, data, ip, ua);
    return { success: true, message: 'User profile updated' };
  }

  // ─── AUTO ADMIRE ───────────────────────────────────
  static async getAutoAdmireUsers() {
    const config = await prisma.platform_config.findUnique({ where: { key: 'AUTO_ADMIRE_USERS' } });
    const userIds = (config?.value as string[]) || [];
    if (userIds.length === 0) return [];

    return prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, display_name: true, account_type: true }
    });
  }

  static async addAutoAdmireUser(_adminId: string, targetUserId: string) {
    const config = await prisma.platform_config.findUnique({ where: { key: 'AUTO_ADMIRE_USERS' } });
    const userIds = (config?.value as string[]) || [];
    
    if (!userIds.includes(targetUserId)) {
      userIds.push(targetUserId);
      await prisma.platform_config.upsert({
        where: { key: 'AUTO_ADMIRE_USERS' },
        update: { value: userIds },
        create: { key: 'AUTO_ADMIRE_USERS', value: userIds }
      });
      await AuditService.log(_adminId, 'AUTO_ADMIRE_ADD' as any, 'user', targetUserId);
    }
    return { success: true, message: 'User added to Auto Admire list' };
  }

  static async removeAutoAdmireUser(_adminId: string, targetUserId: string) {
    const config = await prisma.platform_config.findUnique({ where: { key: 'AUTO_ADMIRE_USERS' } });
    let userIds = (config?.value as string[]) || [];
    
    if (userIds.includes(targetUserId)) {
      userIds = userIds.filter((id: any) => id !== targetUserId);
      await prisma.platform_config.update({
        where: { key: 'AUTO_ADMIRE_USERS' },
        data: { value: userIds }
      });
      await AuditService.log(_adminId, 'AUTO_ADMIRE_REMOVE' as any, 'user', targetUserId);
    }
    return { success: true, message: 'User removed from Auto Admire list' };
  }

  // ─── NAME MANAGEMENT ───────────────────────────────────

  static async addProhibitedName(adminId: string, data: { name: string; reason?: string }) {
    const entry = await prisma.prohibited_names.create({
      data: { id: crypto.randomUUID(), name: data.name.toLowerCase(), reason: data.reason, added_by: adminId}
    } as any);
    await AuditService.log(adminId, ADMIN_ACTIONS.NAME_PROHIBIT, 'prohibited_name', entry.id, data);
    return entry;
  }

  static async removeProhibitedName(adminId: string, nameId: string) {
    await prisma.prohibited_names.delete({ where: { id: nameId } });
    return { success: true };
  }

  static async listProhibitedNames(page = 1, limit = 50) {
    const [items, total] = await Promise.all([
      prisma.prohibited_names.findMany({ orderBy: { created_at: 'desc' }, take: limit, skip: (page - 1) * limit }),
      prisma.prohibited_names.count(),
    ]);
    return { items, total, page, limit };
  }

  static async reserveUsername(adminId: string, data: { username: string; reservedFor?: string; reason?: string }) {
    const entry = await prisma.reserved_usernames.create({
      data: { id: crypto.randomUUID(), username: data.username.toLowerCase(), reserved_for: data.reservedFor, reason: data.reason, reserved_by: adminId}
    } as any);
    await AuditService.log(adminId, ADMIN_ACTIONS.USERNAME_RESERVE, 'reserved_username', entry.id, data);
    return entry;
  }

  static async releaseReservedUsername(adminId: string, usernameId: string) {
    await prisma.reserved_usernames.delete({ where: { id: usernameId } });
    return { success: true };
  }

  static async listReservedUsernames(page = 1, limit = 50) {
    const [items, total] = await Promise.all([
      prisma.reserved_usernames.findMany({ orderBy: { created_at: 'desc' }, take: limit, skip: (page - 1) * limit }),
      prisma.reserved_usernames.count(),
    ]);
    return { items, total, page, limit };
  }
}
