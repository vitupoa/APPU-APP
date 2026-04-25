import cron from 'node-cron';
import { prisma } from '../config/database.js';

export function startFlashSaleWorker() {
  // Every minute — check flash sale statuses
  cron.schedule('* * * * *', async () => {
    const now = new Date();

    try {
      // Activate scheduled flash sales
      await prisma.flashSale.updateMany({
        where: { status: 'SCHEDULED', startTime: { lte: now } },
        data: { status: 'ACTIVE' }
      });

      // End expired flash sales
      await prisma.flashSale.updateMany({
        where: { status: 'ACTIVE', endTime: { lte: now } },
        data: { status: 'ENDED' }
      });

      // Expire premium listings
      await prisma.product.updateMany({
        where: { isFeatured: true, featuredUntil: { lte: now } },
        data: { isFeatured: false }
      });
      await prisma.product.updateMany({
        where: { isPromoted: true, promotedUntil: { lte: now } },
        data: { isPromoted: false }
      });
      await prisma.product.updateMany({
        where: { isTopSpot: true, topSpotUntil: { lte: now } },
        data: { isTopSpot: false }
      });
      await prisma.premiumListing.updateMany({
        where: { isActive: true, endDate: { lte: now } },
        data: { isActive: false }
      });

      // Expire group buys
      await prisma.groupBuy.updateMany({
        where: { status: 'OPEN', expiresAt: { lte: now } },
        data: { status: 'CANCELLED' }
      });
    } catch (error) {
      console.error('Flash sale worker error:', error);
    }
  });

  console.log('Flash sale & premium listing worker started');
}
