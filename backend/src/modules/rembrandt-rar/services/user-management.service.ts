import { prisma } from '../../../config/database.js';
import { Prisma } from '../../../generated/prisma/client.js';
import { AuditService } from './audit.service.js';
import { ADMIN_ACTIONS } from '../rembrandt-rar.types.js';
import { EmailService } from '../../../shared/services/email.service.js';

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
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (accountType) where.accountType = accountType;
    if (isSuspended !== undefined) where.isSuspended = isSuspended;
    if (isVerified !== undefined) where.isVerified = isVerified;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, username: true, email: true, firstName: true, lastName: true,
          displayName: true, avatarUrl: true, country: true, currency: true,
          accountType: true, isAdmin: true, isVerified: true, isSuspended: true,
          isWalletUnlocked: true, createdAt: true, updatedAt: true,
          _count: { select: { shorts: true, contestsCreated: true, admirers: true, posts: true } },
          adminProfile: { select: { role: true, isActive: true } },
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
        wallet: { select: { krBalance: true } },
        adminProfile: true,
        suspensions: { orderBy: { createdAt: 'desc' }, take: 5 },
        _count: {
          select: {
            shorts: true, posts: true, contestsCreated: true,
            admirers: true, admiring: true, transactions: true, stories: true,
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
    const targetProfile = await prisma.adminProfile.findUnique({ where: { userId: targetUserId } });
    if (targetProfile?.role === 'SUPER_ADMIN') {
      throw new Error('Cannot suspend a Super Admin');
    }

    return prisma.$transaction(async (tx) => {
      await tx.userSuspension.create({
        data: {
          userId: targetUserId,
          reason: data.reason,
          suspendedBy: adminId,
          type: data.type,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        }
      });

      await tx.user.update({
        where: { id: targetUserId },
        data: { isSuspended: true, suspendedAt: new Date() }
      });

      await AuditService.log(adminId, ADMIN_ACTIONS.USER_SUSPEND, 'user', targetUserId, {
        reason: data.reason, type: data.type, expiresAt: data.expiresAt
      }, ip, ua);

      return { success: true, message: `User ${data.type.toLowerCase()} successfully` };
    });
  }

  static async unsuspendUser(adminId: string, targetUserId: string, ip?: string, ua?: string) {
    return prisma.$transaction(async (tx) => {
      // Lift active suspensions
      await tx.userSuspension.updateMany({
        where: { userId: targetUserId, liftedAt: null },
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
      data: { isVerified: true }
    });
    await AuditService.log(adminId, ADMIN_ACTIONS.USER_VERIFY, 'user', targetUserId, {}, ip, ua);
    return { success: true, message: 'User verified' };
  }

  static async deleteUser(adminId: string, targetUserId: string, ip?: string, ua?: string) {
    if (adminId === targetUserId) throw new Error('Cannot delete yourself');

    const targetProfile = await prisma.adminProfile.findUnique({ where: { userId: targetUserId } });
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
    const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: adminId } });
    if (adminProfile?.role !== 'SUPER_ADMIN') {
      throw new Error('Only Super Admins can assign roles');
    }

    // Self-protection: can't remove own SUPER_ADMIN if last one
    if (adminId === targetUserId && data.role !== 'SUPER_ADMIN') {
      const superAdminCount = await prisma.adminProfile.count({
        where: { role: 'SUPER_ADMIN', isActive: true }
      });
      if (superAdminCount <= 1) {
        throw new Error('Cannot remove last Super Admin role');
      }
    }

    const existing = await prisma.adminProfile.findUnique({ where: { userId: targetUserId } });

    if (existing) {
      await prisma.adminProfile.update({
        where: { id: existing.id },
        data: { role: data.role as any, permissions: data.permissions ?? undefined, isActive: true }
      });
    } else {
      await prisma.adminProfile.create({
        data: {
          userId: targetUserId,
          role: data.role as any,
          permissions: data.permissions ?? undefined,
          grantedBy: adminId,
        }
      });
    }

    await prisma.user.update({ where: { id: targetUserId }, data: { isAdmin: true } });
    await AuditService.log(adminId, ADMIN_ACTIONS.USER_ROLE_ASSIGN, 'user', targetUserId, { role: data.role }, ip, ua);
    return { success: true, message: `Role ${data.role} assigned` };
  }

  static async revokeRole(adminId: string, targetUserId: string, ip?: string, ua?: string) {
    if (adminId === targetUserId) {
      const superAdminCount = await prisma.adminProfile.count({
        where: { role: 'SUPER_ADMIN', isActive: true }
      });
      if (superAdminCount <= 1) {
        throw new Error('Cannot revoke last Super Admin');
      }
    }

    const targetProfile = await prisma.adminProfile.findUnique({ where: { userId: targetUserId } });
    if (!targetProfile) throw new Error('User has no admin role');

    // Non-super-admins can't revoke super admin
    const adminSelf = await prisma.adminProfile.findUnique({ where: { userId: adminId } });
    if (targetProfile.role === 'SUPER_ADMIN' && adminSelf?.role !== 'SUPER_ADMIN') {
      throw new Error('Cannot revoke Super Admin role');
    }

    await prisma.adminProfile.update({
      where: { id: targetProfile.id },
      data: { isActive: false }
    });
    await prisma.user.update({ where: { id: targetUserId }, data: { isAdmin: false } });
    await AuditService.log(adminId, ADMIN_ACTIONS.USER_ROLE_REVOKE, 'user', targetUserId, {}, ip, ua);
    return { success: true, message: 'Admin role revoked' };
  }

  static async changeUserName(
    adminId: string, targetUserId: string,
    data: { firstName?: string; lastName?: string; displayName?: string; username?: string },
    ip?: string, ua?: string
  ) {
    const updateData: any = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.displayName) updateData.displayName = data.displayName;
    if (data.username) {
      // Check prohibited
      const prohibited = await prisma.prohibitedName.findFirst({
        where: { name: data.username.toLowerCase(), type: { in: ['username', 'both'] } }
      });
      if (prohibited) throw new Error(`Username "${data.username}" is prohibited: ${prohibited.reason}`);

      // Check reserved
      const reserved = await prisma.reservedUsername.findFirst({
        where: { username: data.username.toLowerCase(), reservedFor: { not: targetUserId } }
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

    const user = await prisma.user.update({ where: { id: targetUserId }, data: { passwordHash: hash } });
    // Revoke all refresh tokens to force re-login
    await prisma.refreshToken.deleteMany({ where: { userId: targetUserId } });

    await AuditService.log(adminId, ADMIN_ACTIONS.USER_RESET_PASSWORD, 'user', targetUserId, {}, ip, ua);
    
    // Send email to user
    await EmailService.sendPasswordResetEmail(user.email, tempPassword).catch(e => {
      console.error('Failed to send password reset email:', e);
    });

    return { success: true, tempPassword, message: 'Password reset. Email sent to user.' };
  }

  static async changeUserPassword(adminId: string, targetUserId: string, newPassword: string, ip?: string, ua?: string) {
    const hash = await (await import('bcrypt')).hash(newPassword, 12);
    await prisma.user.update({ where: { id: targetUserId }, data: { passwordHash: hash } });
    await prisma.refreshToken.deleteMany({ where: { userId: targetUserId } });
    await AuditService.log(adminId, ADMIN_ACTIONS.USER_RESET_PASSWORD, 'user', targetUserId, { method: 'manual' }, ip, ua);
    return { success: true, message: 'Password changed successfully.' };
  }

  static async updateUserProfile(
    adminId: string, targetUserId: string,
    data: { bio?: string; country?: string; currency?: string; accountType?: string },
    ip?: string, ua?: string
  ) {
    const updateData: any = { ...data };
    if (data.accountType) updateData.accountType = data.accountType;

    await prisma.user.update({ where: { id: targetUserId }, data: updateData });
    await AuditService.log(adminId, ADMIN_ACTIONS.USER_NAME_CHANGE, 'user', targetUserId, data, ip, ua);
    return { success: true, message: 'User profile updated' };
  }

  // ─── AUTO ADMIRE ───────────────────────────────────
  static async getAutoAdmireUsers() {
    const config = await prisma.platformConfig.findUnique({ where: { key: 'AUTO_ADMIRE_USERS' } });
    const userIds = (config?.value as string[]) || [];
    if (userIds.length === 0) return [];

    return prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, displayName: true, accountType: true }
    });
  }

  static async addAutoAdmireUser(adminId: string, targetUserId: string) {
    const config = await prisma.platformConfig.findUnique({ where: { key: 'AUTO_ADMIRE_USERS' } });
    const userIds = (config?.value as string[]) || [];
    
    if (!userIds.includes(targetUserId)) {
      userIds.push(targetUserId);
      await prisma.platformConfig.upsert({
        where: { key: 'AUTO_ADMIRE_USERS' },
        update: { value: userIds, updatedBy: adminId },
        create: { key: 'AUTO_ADMIRE_USERS', value: userIds, updatedBy: adminId }
      });
      await AuditService.log(adminId, 'AUTO_ADMIRE_ADD' as any, 'user', targetUserId);
    }
    return { success: true, message: 'User added to Auto Admire list' };
  }

  static async removeAutoAdmireUser(adminId: string, targetUserId: string) {
    const config = await prisma.platformConfig.findUnique({ where: { key: 'AUTO_ADMIRE_USERS' } });
    let userIds = (config?.value as string[]) || [];
    
    if (userIds.includes(targetUserId)) {
      userIds = userIds.filter(id => id !== targetUserId);
      await prisma.platformConfig.update({
        where: { key: 'AUTO_ADMIRE_USERS' },
        data: { value: userIds, updatedBy: adminId }
      });
      await AuditService.log(adminId, 'AUTO_ADMIRE_REMOVE' as any, 'user', targetUserId);
    }
    return { success: true, message: 'User removed from Auto Admire list' };
  }

  // ─── NAME MANAGEMENT ───────────────────────────────────

  static async addProhibitedName(adminId: string, data: { name: string; type: string; reason?: string }) {
    const entry = await prisma.prohibitedName.create({
      data: { name: data.name.toLowerCase(), type: data.type, reason: data.reason, addedBy: adminId }
    });
    await AuditService.log(adminId, ADMIN_ACTIONS.NAME_PROHIBIT, 'prohibited_name', entry.id, data);
    return entry;
  }

  static async removeProhibitedName(adminId: string, nameId: string) {
    await prisma.prohibitedName.delete({ where: { id: nameId } });
    return { success: true };
  }

  static async listProhibitedNames(page = 1, limit = 50) {
    const [items, total] = await Promise.all([
      prisma.prohibitedName.findMany({ orderBy: { createdAt: 'desc' }, take: limit, skip: (page - 1) * limit }),
      prisma.prohibitedName.count(),
    ]);
    return { items, total, page, limit };
  }

  static async reserveUsername(adminId: string, data: { username: string; reservedFor?: string; reason?: string }) {
    const entry = await prisma.reservedUsername.create({
      data: { username: data.username.toLowerCase(), reservedFor: data.reservedFor, reason: data.reason, reservedBy: adminId }
    });
    await AuditService.log(adminId, ADMIN_ACTIONS.USERNAME_RESERVE, 'reserved_username', entry.id, data);
    return entry;
  }

  static async releaseReservedUsername(adminId: string, usernameId: string) {
    await prisma.reservedUsername.delete({ where: { id: usernameId } });
    return { success: true };
  }

  static async listReservedUsernames(page = 1, limit = 50) {
    const [items, total] = await Promise.all([
      prisma.reservedUsername.findMany({ orderBy: { createdAt: 'desc' }, take: limit, skip: (page - 1) * limit }),
      prisma.reservedUsername.count(),
    ]);
    return { items, total, page, limit };
  }
}
