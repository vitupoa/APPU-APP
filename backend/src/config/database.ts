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

// Note: Prisma v7 removed $use middleware. Use Prisma Client Extensions instead if needed.
// For now, query monitoring is handled via Prisma log configuration above.

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

logger.info('Database connection initialized');
