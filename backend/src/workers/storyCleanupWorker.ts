import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { deleteExpiredMedia } from '../config/cloudinary.js';

/**
 * Cron job to delete expired stories from database and Cloudinary.
 * Runs every hour.
 */
export function startStoryCleanupWorker() {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      
      // Delete from database
      const dbResult = await prisma.story.deleteMany({
        where: {
          expires_at: { lt: now },
        },
      });

      // Delete from Cloudinary
      const cloudinaryResult = await deleteExpiredMedia();

      } catch (error: any) {
      console.error('[CRON] Story Cleanup failed:', error.message);
    }
  });

  }
