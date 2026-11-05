import cron from 'node-cron';
import { prisma } from '../config/database.js';

export function startFlashSaleWorker() {
  // Every minute — check flash sale statuses
  cron.schedule('* * * * *', async () => {
    const now = new Date();

    try {
      // Activate scheduled flash sales
      await prisma.flash_sales.updateMany({
        where: { status: 'SCHEDULED', start_time: { lte: now } },
        data: { status: 'ACTIVE' }
      });

      // End expired flash sales
      await prisma.flash_sales.updateMany({
        where: { status: 'ACTIVE', end_time: { lte: now } },
        data: { status: 'ENDED' }
      });

      // Expire premium listings
      await prisma.products.updateMany({
        where: { is_featured: true, featured_until: { lte: now } },
        data: { is_featured: false }
      });
      await prisma.products.updateMany({
        where: { is_promoted: true, promoted_until: { lte: now } },
        data: { is_promoted: false }
      });
      await prisma.products.updateMany({
        where: { is_top_spot: true, top_spot_until: { lte: now } },
        data: { is_top_spot: false }
      });
      await prisma.premium_listings.updateMany({
        where: { is_active: true, end_date: { lte: now } },
        data: { is_active: false }
      });

      // Expire group buys
      await prisma.group_buys.updateMany({
        where: { status: 'OPEN', expires_at: { lte: now } },
        data: { status: 'CANCELLED' }
      });
    } catch (error) {
      console.error('Flash sale worker error:', error);
    }
  });

  }
