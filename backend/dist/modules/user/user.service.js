import { prisma } from '../../config/database.js';
const SUBSCRIPTION_PLATFORM_FEE = 0.15; // 15%
export class UserService {
    /**
     * Get full user profile with relationship status and stats.
     */
    static async getProfile(userId, viewerId) {
        const user = await prisma.user.findUniqueOrThrow({
            where: { id: userId },
            include: {
                bioLinks: { orderBy: { sortOrder: 'asc' } },
                _count: {
                    select: {
                        admirers: true,
                        admiring: true,
                        contestWins: true
                    }
                }
            }
        });
        // Compute lovers count (mutual admires)
        const loversCount = await prisma.admire.count({
            where: { admirerId: userId, isLovers: true }
        });
        // Determine relationship status with viewer
        let relationshipStatus = 'NONE';
        if (viewerId && viewerId !== userId) {
            const iAdmireThem = await prisma.admire.findUnique({
                where: { admirerId_admiredId: { admirerId: viewerId, admiredId: userId } }
            });
            const theyAdmireMe = await prisma.admire.findUnique({
                where: { admirerId_admiredId: { admirerId: userId, admiredId: viewerId } }
            });
            if (iAdmireThem && theyAdmireMe) {
                relationshipStatus = 'LOVERS';
            }
            else if (iAdmireThem) {
                relationshipStatus = 'ADMIRING';
            }
            else if (theyAdmireMe) {
                relationshipStatus = 'ADMIRED_BY';
            }
        }
        return {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            coverPhotoUrl: user.coverPhotoUrl,
            bio: user.bio,
            country: user.country,
            currency: user.currency,
            accountType: user.accountType,
            isVerified: user.isVerified,
            isWalletUnlocked: user.isWalletUnlocked,
            bioLinks: user.bioLinks,
            stats: {
                admirers: user._count.admirers,
                admiring: user._count.admiring,
                lovers: loversCount,
                contestsWon: user._count.contestWins
            },
            relationshipStatus,
            createdAt: user.createdAt.toISOString()
        };
    }
    /**
     * Update own profile. Rejects name/username changes if wallet is unlocked.
     */
    static async updateProfile(userId, data) {
        const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
        // Identity lock check — reject name/username changes when wallet is unlocked
        if (user.isWalletUnlocked) {
            if (data.firstName || data.lastName || data.displayName || data.username) {
                throw new Error('Name and username are permanently locked after wallet activation');
            }
        }
        const updateData = {};
        if (data.bio !== undefined)
            updateData.bio = data.bio;
        if (data.avatarUrl !== undefined)
            updateData.avatarUrl = data.avatarUrl;
        if (data.coverPhotoUrl !== undefined)
            updateData.coverPhotoUrl = data.coverPhotoUrl;
        if (!user.isWalletUnlocked) {
            if (data.firstName)
                updateData.firstName = data.firstName;
            if (data.lastName)
                updateData.lastName = data.lastName;
            if (data.displayName)
                updateData.displayName = data.displayName;
            if (data.username)
                updateData.username = data.username;
        }
        return prisma.user.update({ where: { id: userId }, data: updateData });
    }
    /**
     * Admire a user. If mutual, both records become lovers.
     */
    static async admire(admirerId, admiredId) {
        if (admirerId === admiredId)
            throw new Error('Cannot admire yourself');
        return prisma.$transaction(async (tx) => {
            // Create the admire record
            const admire = await tx.admire.create({
                data: { admirerId, admiredId }
            });
            // Check if the other person already admires back → mutual = lovers
            const reverse = await tx.admire.findUnique({
                where: { admirerId_admiredId: { admirerId: admiredId, admiredId: admirerId } }
            });
            if (reverse) {
                // Set both to lovers
                await tx.admire.update({ where: { id: admire.id }, data: { isLovers: true } });
                await tx.admire.update({ where: { id: reverse.id }, data: { isLovers: true } });
            }
            return { admired: true, isLovers: !!reverse };
        });
    }
    /**
     * Unadmire a user. If they were lovers, both records lose lover status.
     */
    static async unadmire(admirerId, admiredId) {
        return prisma.$transaction(async (tx) => {
            const admire = await tx.admire.findUnique({
                where: { admirerId_admiredId: { admirerId, admiredId } }
            });
            if (!admire)
                throw new Error('Not admiring this user');
            // If they were lovers, remove lover status from the reverse record too
            if (admire.isLovers) {
                await tx.admire.updateMany({
                    where: { admirerId: admiredId, admiredId: admirerId },
                    data: { isLovers: false }
                });
            }
            await tx.admire.delete({ where: { id: admire.id } });
            return { admired: false };
        });
    }
    /**
     * Get paginated list of users who admire the given userId.
     */
    static async getAdmirers(userId, cursor, limit = 20) {
        const records = await prisma.admire.findMany({
            where: { admiredId: userId },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { createdAt: 'desc' },
            include: {
                admirer: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true }
                }
            }
        });
        const hasMore = records.length > limit;
        const items = hasMore ? records.slice(0, limit) : records;
        return {
            items: items.map((r) => ({ ...r.admirer, isLovers: r.isLovers })),
            nextCursor: hasMore ? items[items.length - 1].id : null
        };
    }
    /**
     * Get paginated list of users the given userId admires.
     */
    static async getAdmiring(userId, cursor, limit = 20) {
        const records = await prisma.admire.findMany({
            where: { admirerId: userId },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { createdAt: 'desc' },
            include: {
                admired: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true }
                }
            }
        });
        const hasMore = records.length > limit;
        const items = hasMore ? records.slice(0, limit) : records;
        return {
            items: items.map((r) => ({ ...r.admired, isLovers: r.isLovers })),
            nextCursor: hasMore ? items[items.length - 1].id : null
        };
    }
    /**
     * Get mutual admirers (lovers).
     */
    static async getLovers(userId, cursor, limit = 20) {
        const records = await prisma.admire.findMany({
            where: { admirerId: userId, isLovers: true },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { createdAt: 'desc' },
            include: {
                admired: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true }
                }
            }
        });
        const hasMore = records.length > limit;
        const items = hasMore ? records.slice(0, limit) : records;
        return {
            items: items.map((r) => r.admired),
            nextCursor: hasMore ? items[items.length - 1].id : null
        };
    }
    // ─── BIO LINKS ─────────────────────────────────────
    static async updateBioLinks(userId, links) {
        return prisma.$transaction(async (tx) => {
            await tx.bioLink.deleteMany({ where: { userId } });
            if (links.length > 0) {
                await tx.bioLink.createMany({
                    data: links.map((l, i) => ({
                        userId,
                        label: l.label,
                        url: l.url,
                        icon: l.icon,
                        sortOrder: i
                    }))
                });
            }
            return tx.bioLink.findMany({ where: { userId }, orderBy: { sortOrder: 'asc' } });
        });
    }
    // ─── MILESTONES ────────────────────────────────────
    static async getMilestones() {
        return prisma.milestone.findMany({
            include: {
                completions: {
                    include: { user: { select: { id: true, username: true, displayName: true } } }
                }
            }
        });
    }
    static async getUserMilestoneProgress(userId) {
        const milestones = await prisma.milestone.findMany({
            include: {
                completions: {
                    where: { userId },
                    include: { user: { select: { id: true, username: true, displayName: true } } }
                }
            }
        });
        return milestones.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            requirementType: m.requirementType,
            requirementValue: m.requirementValue,
            rewardKr: Number(m.rewardKr),
            isCompleted: m.completions.length > 0,
            completedBy: m.completions[0]?.user ?? null
        }));
    }
}
//# sourceMappingURL=user.service.js.map