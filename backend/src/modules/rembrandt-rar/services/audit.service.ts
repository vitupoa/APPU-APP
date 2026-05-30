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
    return prisma.audit_logs.create({
      data: {
        performed_by: adminId,
        action_type: action,
        target_user_id: targetId,
        action_details: {
          target_type: targetType,
          details: details ?? {}
        } as any,
        ip_address: ipAddress ?? null,
        user_agent: userAgent ?? null,
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

    if (adminId) where.performed_by = adminId;
    if (action) where.action_type = { contains: action };
    if (targetType) where.action_details = { path: ['target_type'], equals: targetType };
    if (targetId) where.target_user_id = targetId;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = startDate;
      if (endDate) where.created_at.lte = endDate;
    }

    const [items, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.audit_logs.count({ where }),
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
