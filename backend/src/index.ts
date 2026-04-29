import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { env } from './config/env.js';
import { Logger } from './utils/logger.js';
import { initializeGateway } from './shared/gateway/socket.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { authMiddleware } from './middleware/auth.js';
import { getCsrfToken } from './middleware/csrfProtection.js';
import { jwtSecretManager } from './utils/jwtRotation.js';
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
import cloudinaryWebhookRoutes from './modules/media/cloudinary-webhook.routes.js';
import commentsRoutes from './modules/comments/comments.routes.js';
import teamsRoutes from './modules/teams/teams.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import { storiesRoutes } from './modules/stories/stories.routes.js';
import { chamaRoutes } from './modules/chama/chama.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import marketplaceRoutes from './modules/marketplace/marketplace.routes.js';
import oauthRoutes from './modules/marketplace/oauth.routes.js';
import { rembrandtRarRoutes } from './modules/rembrandt-rar/rembrandt-rar.routes.js';
import liveRoutes from './modules/live/live.routes.js';
import callsRoutes from './modules/calls/calls.routes.js';
import exploreRoutes from './modules/explore/explore.routes.js';
import recommendationRoutes from './modules/recommendation/recommendation.routes.js';
import escrowRoutes from './modules/escrow/escrow.routes.js';
import kycRoutes from './modules/kyc/kyc.routes.js';
import { startChamaDefaultWorker } from './workers/chamaDefaultWorker.js';
import { startStoryCleanupWorker } from './workers/storyCleanupWorker.js';
import { startDailyPrizeWorker } from './workers/dailyPrizeWorker.js';
import { startFlashSaleWorker } from './workers/flashSaleWorker.js';
import { FCMService } from './services/fcm.service.js';
import { initializeLiveSocket } from './shared/gateway/liveSocket.js';
import { initializeCallSocket } from './shared/gateway/call-socket.js';
import { initializeDatabaseMonitorSocket } from './shared/gateway/databaseMonitorSocket.js';

const app = express();
const httpServer = createServer(app);
const logger = new Logger('Server');

// Configure Express to trust proxy headers. This is required when the app runs behind a reverse proxy (nginx, load balancer, CDN). It allows Express to correctly extract client IP from X-Forwarded-For header.
app.set('trust proxy', true);

// Socket.io Redis Clustered Gateway for real-time features (milestones, contests, notifications)
const io = initializeGateway(httpServer);

// Initialize Live Streaming WebSocket
const liveSocket = initializeLiveSocket(httpServer);

// Initialize Call socket handlers
initializeCallSocket(io);

// Initialize Database Monitoring WebSocket (Super Admin only)
const dbMonitorSocket = initializeDatabaseMonitorSocket(httpServer);

// Global middleware
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging and performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Add request ID to request object
  (req as any).requestId = requestId;
  
  // Log request
  logger.debug(`[${requestId}] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = (req as any).user?.id;
    
    logger.logRequest(req.method, req.path, userId, duration);
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn(`[${requestId}] Slow request: ${req.method} ${req.path} took ${duration}ms`, {
        userId,
        statusCode: res.statusCode,
      });
    }
  });
  
  next();
});

app.use(rateLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'krieta-api', version: '1.0.0' });
});

// CSRF token endpoint
app.get('/api/v1/csrf-token', authMiddleware, getCsrfToken);

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
app.use('/api/v1/media', cloudinaryWebhookRoutes);
app.use('/api/v1/comments', commentsRoutes);
app.use('/api/v1/teams', teamsRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/stories', storiesRoutes);
app.use('/api/v1/chamas', chamaRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/oauth', oauthRoutes);
app.use('/api/v1/rar', rembrandtRarRoutes);
app.use('/api/v1/live', liveRoutes);
app.use('/api/v1/calls', callsRoutes);
app.use('/api/v1/explore', exploreRoutes);
app.use('/api/v1/recommendation', recommendationRoutes);
app.use('/api/v1/escrow', escrowRoutes);
app.use('/api/v1/kyc', kycRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Endpoints connected, Socket.io manages connections internally.

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.fatal('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = env.PORT || 3000;

// Initialize JWT rotation manager
await jwtSecretManager.initialize();
logger.info('JWT Secret Manager initialized');

httpServer.listen(PORT, () => {
  logger.info(`Krieta API running on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`CORS Origin: ${env.CORS_ORIGIN}`);
  
  // Start cron workers
  logger.info('Starting background workers...');
  startChamaDefaultWorker();
  startStoryCleanupWorker();
  startDailyPrizeWorker();
  startFlashSaleWorker();
  
  // Start escrow approval cleanup worker
  const { startEscrowApprovalCleanupWorker } = await import('./workers/escrowApprovalCleanup.worker.js');
  startEscrowApprovalCleanupWorker();
  
  // Start recommendation system workers
  const { startContentDistributionWorker } = await import('./workers/contentDistributionWorker.js');
  const { startMicroInterestWorker } = await import('./workers/microInterestWorker.js');
  const { startTrendingTopicsWorker } = await import('./workers/trendingTopicsWorker.js');
  const { SocialMediaSyncWorker } = await import('./workers/socialMediaSync.worker.js');
  const { startWithdrawalLimitResetWorker } = await import('./workers/withdrawalLimitReset.worker.js');
  const { startNonceCleanupWorker } = await import('./workers/nonceCleanup.worker.js');
  
  startContentDistributionWorker();
  startMicroInterestWorker();
  startTrendingTopicsWorker();
  SocialMediaSyncWorker.start();
  startWithdrawalLimitResetWorker();
  startNonceCleanupWorker();
  
  logger.info('All workers started successfully');
  logger.info('Server ready to accept connections');
});

export { app, io };
