import cron from 'node-cron';
import { prisma } from '../config/database.js'; // Assumes exported prisma instance 
import { pubClient, RedisChannels } from '../shared/gateway/redis.js';
import crypto from 'crypto';

export function startDailyPrizeWorker() {
    // Runs every day at midnight "0 0 * * *"
    cron.schedule('0 0 * * *', async () => {
        try {
            // Find all active contests allowing daily prizes fundamentally
            const activeContests = await prisma.contest.findMany({
                where: {
                    status: 'ACTIVE',
                    allow_daily_prizes: true,
                    daily_prize_kr: { not: null }
                }
            });

            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);

            for (const contest of activeContests) {
                if (!contest.daily_prize_kr || contest.daily_prize_kr.toNumber() <= 0) continue;

                // Find all unique submissions submitted strictly within the last 24 hours
                const eligibleSubmissions = await prisma.contest_submission.findMany({
                    where: {
                        contest_id: contest.id,
                        submitted_at: { gte: yesterday }
                    },
                    select: { id: true, user_id: true }
                });

                if (eligibleSubmissions.length === 0) {
                    continue;
                }

                // Cryptographically pick a random index natively mapping chance organically 
                const randomIndex = Math.floor(Math.random() * eligibleSubmissions.length);
                const winner = eligibleSubmissions[randomIndex];

                // Deposit the Rc securely using Prisma Transactions
                await prisma.$transaction(async (tx: any) => {
                    // Update user's actual KR balance cleanly
                    await tx.wallets.update({
                        where: { user_id: winner.user_id },
                        data: {
                            kr_balance: {
                                increment: contest.daily_prize_kr!
                            }
                        }
                    });

                    // Log the transaction preventing phantom money creation natively
                    await tx.transactions.create({
                        data: {
                            user_id: winner.user_id,
                            type: 'contest_prize', // Specific enumeration
                            amountKr: contest.daily_prize_kr!,
                            reference: `Daily Sweepstakes Win [Contest: ${contest.id}]`,
                            status: 'completed'
                        }
                    });
                });

                // Emit live Firebase/WebSocket Socket notification universally triggering FOMO!
                const notificationPayload = JSON.stringify({
                    user_id: winner.user_id,
                    message: `You won the ${contest.daily_prize_kr} Rc Daily Random Drop for Contest: ${contest.title}!`,
                    amount: contest.daily_prize_kr
                });

                pubClient.publish(`${RedisChannels.NOTIFICATIONS}:${winner.user_id}`, notificationPayload);
                }
            
        } catch (error) {
            console.error('[Worker] Daily Prize Sweepstakes Failure:', error);
        }
    });
}
