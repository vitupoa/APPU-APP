import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { env } from './config/env.js';
import { initializeGateway } from './shared/gateway/socket.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import authRoutes from './modules/auth/auth.routes.js';
import walletRoutes from './modules/wallet/wallet.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import shortsRoutes from './modules/shorts/shorts.routes.js';
import feedRoutes from './modules/feed/feed.routes.js';
import contestsRoutes from './modules/contests/contests.routes.js';
import userRoutes from './modules/user/user.routes.js';
import shopRoutes from './modules/shop/shop.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import adsRoutes from './modules/ads/ads.routes.js';
import sponsoredRoutes from './modules/sponsored/sponsored.routes.js';
import cacheRoutes from './modules/cache/cache.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import commentsRoutes from './modules/comments/comments.routes.js';
import teamsRoutes from './modules/teams/teams.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import { storiesRoutes } from './modules/stories/stories.routes.js';
import { chamaRoutes } from './modules/chama/chama.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import marketplaceRoutes from './modules/marketplace/marketplace.routes.js';
import { rembrandtRarRoutes } from './modules/rembrandt-rar/rembrandt-rar.routes.js';
import liveRoutes from './modules/live/live.routes.js';
import callsRoutes from './modules/calls/calls.routes.js';
import { startChamaDefaultWorker } from './workers/chamaDefaultWorker.js';
import { startStoryCleanupWorker } from './workers/storyCleanupWorker.js';
import { startDailyPrizeWorker } from './workers/dailyPrizeWorker.js';
import { startFlashSaleWorker } from './workers/flashSaleWorker.js';
import { FCMService } from './services/fcm.service.js';
import { initializeLiveSocket } from './shared/gateway/live-socket.js';
import { initializeCallSocket } from './shared/gateway/call-socket.js';

const app = express();
const httpServer = createServer(app);

// Configure Express to trust proxy headers. This is required when the app runs behind a reverse proxy (nginx, load balancer, CDN). It allows Express to correctly extract client IP from X-Forwarded-For header.
app.set('trust proxy', true);

// Socket.io Redis Clustered Gateway for real-time features (milestones, contests, notifications)
const io = initializeGateway(httpServer);

// Initialize Live Streaming and Call socket handlers
initializeLiveSocket(io);
initializeCallSocket(io);

// Global middleware
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'krieta-api', version: '1.0.0' });
});

// API Routes — mounted as modules are implemented
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/shorts', shortsRoutes);
app.use('/api/v1/feed', feedRoutes);
app.use('/api/v1/contests', contestsRoutes);
app.use('/api/v1/shop', shopRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/ads', adsRoutes);
app.use('/api/v1/sponsored', sponsoredRoutes);
app.use('/api/v1/cache', cacheRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/comments', commentsRoutes);
app.use('/api/v1/teams', teamsRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/stories', storiesRoutes);
app.use('/api/v1/chamas', chamaRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/rar', rembrandtRarRoutes);
app.use('/api/v1/live', liveRoutes);
app.use('/api/v1/calls', callsRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Endpoints connected, Socket.io manages connections internally.

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Krieta API running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  
  // Start cron workers
  startChamaDefaultWorker();
  startStoryCleanupWorker();
  startDailyPrizeWorker();
  startFlashSaleWorker();
});

export { app, io };
