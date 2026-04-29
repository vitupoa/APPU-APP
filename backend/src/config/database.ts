import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('Database');

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL! });

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Query performance monitoring middleware
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  const duration = after - before;

  // Log slow queries (> 1 second)
  if (duration > 1000) {
    logger.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`, {
      model: params.model,
      action: params.action,
      duration,
    });
  }

  // Log all queries in development
  if (env.NODE_ENV === 'development' && duration > 100) {
    logger.debug(`Query: ${params.model}.${params.action} took ${duration}ms`);
  }

  return result;
});

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

logger.info('Database connection initialized');
