import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { deleteExpiredMedia } from '../config/cloudinary.js';

/**
 * Cron job to delete expired stories from database and Cloudinary.
 * Runs every hour.
 */
export function startStoryCleanupWorker() {
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running Story Cleanup...');
    try {
      const now = new Date();
      
      // Delete from database
      const dbResult = await prisma.story.deleteMany({
        where: {
          expiresAt: { lt: now },
        },
      });

      // Delete from Cloudinary
      const cloudinaryResult = await deleteExpiredMedia();

      console.log(`[CRON] Story Cleanup completed: ${dbResult.count} stories deleted from DB, ${cloudinaryResult.deleted} media files deleted from Cloudinary.`);
    } catch (error: any) {
      console.error('[CRON] Story Cleanup failed:', error.message);
    }
  });

  console.log('[CRON] Story Cleanup Worker started (runs hourly)');
}
