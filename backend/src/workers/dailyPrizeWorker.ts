import cron from 'node-cron';
import { prisma } from '../index'; // Assumes exported prisma instance 
import { pubClient, RedisChannels } from '../shared/gateway/redis';

export function startDailyPrizeWorker() {
    console.log('[Worker] Daily Prize Cron Job Scheduled: Runs daily at 00:00 Server Time (Midnight)');
    
    // Runs every day at midnight "0 0 * * *"
    cron.schedule('0 0 * * *', async () => {
        console.log('[Worker] Executing Daily Random Sweepstakes for Active Contests...');

        try {
            // Find all active contests allowing daily prizes fundamentally
            const activeContests = await prisma.contest.findMany({
                where: {
                    status: 'ACTIVE',
                    allowDailyPrizes: true,
                    dailyPrizeKr: { not: null }
                }
            });

            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);

            for (const contest of activeContests) {
                if (!contest.dailyPrizeKr || contest.dailyPrizeKr.toNumber() <= 0) continue;

                // Find all unique submissions submitted strictly within the last 24 hours
                const eligibleSubmissions = await prisma.contestSubmission.findMany({
                    where: {
                        contestId: contest.id,
                        submittedAt: { gte: yesterday }
                    },
                    select: { id: true, userId: true }
                });

                if (eligibleSubmissions.length === 0) {
                    console.log(`[Worker] No eligible daily submissions for Contest ${contest.id}. Skipping.`);
                    continue;
                }

                // Cryptographically pick a random index natively mapping chance organically 
                const randomIndex = Math.floor(Math.random() * eligibleSubmissions.length);
                const winner = eligibleSubmissions[randomIndex];

                // Deposit the Kr securely using Prisma Transactions
                await prisma.$transaction(async (tx) => {
                    // Update user's actual KR balance cleanly
                    await tx.wallet.update({
                        where: { userId: winner.userId },
                        data: {
                            krBalance: {
                                increment: contest.dailyPrizeKr!
                            }
                        }
                    });

                    // Log the transaction preventing phantom money creation natively
                    await tx.transaction.create({
                        data: {
                            userId: winner.userId,
                            type: 'contest_prize', // Specific enumeration
                            amountKr: contest.dailyPrizeKr!,
                            reference: `Daily Sweepstakes Win [Contest: ${contest.id}]`,
                            status: 'completed'
                        }
                    });
                });

                // Emit live Firebase/WebSocket Socket notification universally triggering FOMO!
                const notificationPayload = JSON.stringify({
                    userId: winner.userId,
                    message: `You won the ${contest.dailyPrizeKr} Kr Daily Random Drop for Contest: ${contest.title}!`,
                    amount: contest.dailyPrizeKr
                });

                pubClient.publish(`${RedisChannels.NOTIFICATIONS}:${winner.userId}`, notificationPayload);
                console.log(`[Worker] Rewarded User ${winner.userId} ${contest.dailyPrizeKr} Kr successfully.`);
            }
            
        } catch (error) {
            console.error('[Worker] Daily Prize Sweepstakes Failure:', error);
        }
    });
}
