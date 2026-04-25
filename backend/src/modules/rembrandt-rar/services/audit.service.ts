import { prisma } from '../../../config/database.js';

export class AuditService {
  static async log(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    details?: Record<string, unknown>,
    ipAddress?: string | null,
    userAgent?: string | null
  ) {
    return prisma.auditLog.create({
      data: {
        adminId, action, targetType, targetId,
        details: (details ?? undefined) as any,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      }
    });
  }

  static async getLogs(options: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { page = 1, limit = 50, adminId, action, targetType, targetId, startDate, endDate } = options;
    const where: any = {};

    if (adminId) where.adminId = adminId;
    if (action) where.action = { contains: action };
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
