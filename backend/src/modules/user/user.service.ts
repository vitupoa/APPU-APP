import { prisma } from '../../config/database.js';
import crypto from 'crypto';

export class UserService {
  /**
   * Get full user profile with relationship status and stats.
   */
  static async getProfile(userId: string, viewerId?: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        bio_links: { orderBy: { sort_order: 'asc' } },
        _count: { select: { admires_admires_admired_idTouser: true,
            admires_admires_admirer_idToUser: true,
            contest_winners: true
          }
        }
      }
    });

    // Compute lovers count (mutual admires)
    const loversCount = await prisma.admires.count({
      where: { admirer_id: userId, is_lovers: true }
    });

    // Determine relationship status with viewer
    let relationshipStatus = 'NONE';
    if (viewerId && viewerId !== userId) {
      const iAdmireThem = await prisma.admires.findUnique({
        where: { admirer_id_admired_id: { admirer_id: viewerId, admired_id: userId } }
      });
      const theyAdmireMe = await prisma.admires.findUnique({
        where: { admirer_id_admired_id: { admirer_id: userId, admired_id: viewerId } }
      });

      if (iAdmireThem && theyAdmireMe) {
        relationshipStatus = 'LOVERS';
      } else if (iAdmireThem) {
        relationshipStatus = 'ADMIRING';
      } else if (theyAdmireMe) {
        relationshipStatus = 'ADMIRED_BY';
      }
    }

    // SECURITY: Only return sensitive data for own profile
    const baseProfile = {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      cover_photo_url: user.cover_photo_url,
      bio: user.bio,
      country: user.country,
      account_type: user.account_type,
      is_verified: user.is_verified,
      bioLinks: user.bio_links,
      stats: {
        admirers: user._count.admires_admires_admired_idToUser,
        admiring: user._count.admires_admires_admirer_idToUser,
        lovers: loversCount,
        contestsWon: user._count.contest_winners
      },
      relationshipStatus,
      created_at: user.created_at.toISOString()
    };

    // Only include sensitive data for own profile
    if (viewerId === userId) {
      return {
        ...baseProfile,
        currency: user.currency,
        is_wallet_unlocked: user.is_wallet_unlocked,
        selectedNiches: user.selectedNiches || [],
        customNiches: user.customNiches || []
      };
    }

    return baseProfile;
  }

  /**
   * Update own profile. Rejects name/username changes if wallet is unlocked.
   */
  static async updateProfile(userId: string, data: {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    username?: string;
    bio?: string;
    avatar_url?: string;
    cover_photo_url?: string;
  }) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    // Identity lock check — reject name/username changes when wallet is unlocked
    if (user.is_wallet_unlocked) {
      if (data.first_name || data.last_name || data.display_name || data.username) {
        throw new Error('Name and username are permanently locked after wallet activation');
      }
    }

    const updateData: any = {};
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
    if (data.cover_photo_url !== undefined) updateData.cover_photo_url = data.cover_photo_url;
    if (!user.is_wallet_unlocked) {
      if (data.first_name) updateData.first_name = data.first_name;
      if (data.last_name) updateData.last_name = data.last_name;
      if (data.display_name) updateData.display_name = data.display_name;
      if (data.username) updateData.username = data.username;
    }

    return prisma.user.update({ where: { id: userId }, data: updateData });
  }

  /**
   * Admire a user. If mutual, both records become lovers.
   */
  static async admire(admirerId: string, admiredId: string) {
    if (admirerId === admiredId) throw new Error('Cannot admire yourself');

    return prisma.$transaction(async (tx) => {
      // Create the admire record
      const admire = await tx.admires.create({
        data: { admirer_id: admirerId, admired_id: admiredId }
      });

      // Check if the other person already admires back → mutual = lovers
      const reverse = await tx.admires.findUnique({
        where: { admirer_id_admired_id: { admirer_id: admiredId, admired_id: admirerId } }
      });

      if (reverse) {
        // Set both to lovers
        await tx.admires.update({ where: { id: admire.id }, data: { is_lovers: true } });
        await tx.admires.update({ where: { id: reverse.id }, data: { is_lovers: true } });
      }

      return { admired: true, isLovers: !!reverse };
    });
  }

  /**
   * Unadmire a user. If they were lovers, both records lose lover status.
   */
  static async unadmire(admirerId: string, admiredId: string) {
    return prisma.$transaction(async (tx) => {
      const admire = await tx.admires.findUnique({
        where: { admirer_id_admired_id: { admirer_id: admirerId, admired_id: admiredId } }
      });
      if (!admire) throw new Error('Not admiring this user');

      // If they were lovers, remove lover status from the reverse record too
      if (admire.is_lovers) {
        await tx.admires.updateMany({
          where: { admirer_id: admiredId, admired_id: admirerId },
          data: { is_lovers: false }
        });
      }

      await tx.admires.delete({ where: { id: admire.id } });

      return { admired: false };
    });
  }

  /**
   * Unlove a user. Removes the lovers status from both records, but keeps the admiring.
   */
  static async unlove(admirerId: string, admiredId: string) {
    return prisma.$transaction(async (tx) => {
      const admire = await tx.admires.findUnique({
        where: { admirer_id_admired_id: { admirer_id: admirerId, admired_id: admiredId } }
      });
      if (!admire || !admire.is_lovers) throw new Error('Not lovers with this user');

      // Unloving means completely breaking the admire link from this side
      await tx.admires.updateMany({
        where: { admirer_id: admiredId, admired_id: admirerId },
        data: { is_lovers: false }
      });

      await tx.admires.delete({ where: { id: admire.id } });

      return { isLovers: false };
    });
  }

  /**
   * Get paginated list of users who admire the given userId.
   */
  static async getAdmirers(userId: string, cursor?: string, limit = 20) {
    const records = await prisma.admires.findMany({
      where: { admired_id: userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { created_at: 'desc' },
      include: {
        user_admires_admirer_idTouser: {
          select: { id: true, username: true, display_name: true, avatar_url: true, is_verified: true }
        }
      }
    });

    const hasMore = records.length > limit;
    const items = hasMore ? records.slice(0, limit) : records;
    return {
      items: items.map((r: any) => ({ ...r.user_admires_admirer_idTouser, isLovers: r.is_lovers })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  /**
   * Get paginated list of users the given userId admires.
   */
  static async getAdmiring(userId: string, cursor?: string, limit = 20) {
    const records = await prisma.admires.findMany({
      where: { admirer_id: userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { created_at: 'desc' },
      include: {
        user_admires_admired_idTouser: {
          select: { id: true, username: true, display_name: true, avatar_url: true, is_verified: true }
        }
      }
    });

    const hasMore = records.length > limit;
    const items = hasMore ? records.slice(0, limit) : records;
    return {
      items: items.map((r: any) => ({ ...r.user_admires_admired_idTouser, isLovers: r.is_lovers })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  /**
   * Get mutual admirers (lovers).
   */
  static async getLovers(userId: string, cursor?: string, limit = 20) {
    const records = await prisma.admires.findMany({
      where: { admirer_id: userId, is_lovers: true },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { created_at: 'desc' },
      include: {
        user_admires_admired_idTouser: {
          select: { id: true, username: true, display_name: true, avatar_url: true, is_verified: true }
        }
      }
    });

    const hasMore = records.length > limit;
    const items = hasMore ? records.slice(0, limit) : records;
    return {
      items: items.map((r: any) => r.user_admires_admired_idTouser),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  /**
   * Search creators by admire count for businesses.
   */
  static async searchCreatorsByAdmireCount(minAdmirers?: number, cursor?: string, limit = 20) {
    const users = await prisma.user.findMany({
      where: {
        account_type: 'CREATOR',
        admires_admires_admired_idToUser: minAdmirers ? { some: {} } : undefined
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { admires_admires_admired_idToUser: { _count: 'desc' } },
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar_url: true,
        bio: true,
        is_verified: true,
        _count: { select: { admires_admires_admired_idTouser: true } }
      }
    });

    const filteredUsers = minAdmirers 
      ? users.filter((u: any) => u._count.admires_admires_admired_idToUser >= minAdmirers)
      : users;

    const hasMore = filteredUsers.length > limit;
    const items = hasMore ? filteredUsers.slice(0, limit) : filteredUsers;
    
    return {
      items: items.map((u: any) => ({
        id: u.id,
        username: u.username,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        bio: u.bio,
        is_verified: u.is_verified,
        admirersCount: u._count.admires_admires_admired_idToUser
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  // ─── BIO LINKS ─────────────────────────────────────

  static async updateBioLinks(userId: string, links: { label: string; url: string; icon?: string }[]) {
    return prisma.$transaction(async (tx) => {
      await tx.bio_links.deleteMany({ where: { user_id: userId } });
      if (links.length > 0) {
        await tx.bio_links.createMany({
          data: links.map((l, i) => ({
            user_id: userId,
            label: l.label,
            url: l.url,
            icon: l.icon,
            sort_order: i
          }))
        });
      }
      return tx.bio_links.findMany({ where: { user_id: userId }, orderBy: { sort_order: 'asc' } });
    });
  }

  // ─── MILESTONES ────────────────────────────────────

  static async getMilestones() {
    return prisma.milestones.findMany({
      include: {
        milestone_completions: {
          include: { user: { select: { id: true, username: true, display_name: true } } }
        }
      }
    });
  }

  static async getUserMilestoneProgress(userId: string) {
    const milestones = await prisma.milestones.findMany({
      include: {
        milestone_completions: {
          where: { user_id: userId },
          include: { user: { select: { id: true, username: true, display_name: true } } }
        }
      }
    });

    return milestones.map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      requirement_type: m.requirement_type,
      requirement_value: m.requirement_value,
      reward_kr: Number(m.reward_kr),
      isCompleted: m.milestone_completions.length > 0,
      completedBy: m.milestone_completions[0]?.user ?? null
    }));
  }
}
