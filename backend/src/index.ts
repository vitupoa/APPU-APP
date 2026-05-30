import express from 'express';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { env } from './config/env.js';
import { helmetConfig, corsConfig, additionalSecurityHeaders } from './config/security.js';
import { Logger } from './utils/logger.js';
import { initializeGateway } from './shared/gateway/socket.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { authMiddleware } from './middleware/auth.js';
import { setRLSContext } from './middleware/rls.js';
import { apiRateLimiter } from './middleware/ipRateLimiter.js';
import { sanitizeInputs, preventPathTraversal, preventCommandInjection } from './middleware/sanitization.js';
import { getCsrfToken } from './middleware/csrfProtection.js';
import { globalRateLimiter } from './middleware/rateLimiting.js';
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
import adManagementRoutes from './modules/ads/adManagement.routes.js';
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
import displayAdsRoutes from './modules/displayAds/displayAds.routes.js';
import locationsRoutes from './modules/locations/locations.routes.js';
import creatorBoostRoutes from './modules/creatorBoost/creatorBoost.routes.js';
import nichesRoutes from './modules/niches/niches.routes.js';
import { rembrandtRarRoutes } from './modules/rembrandt-rar/rembrandt-rar.routes.js';

import exploreRoutes from './modules/explore/explore.routes.js';
import recommendationRoutes from './modules/recommendation/recommendation.routes.js';
import escrowRoutes from './modules/escrow/escrow.routes.js';
import kycRoutes from './modules/kyc/kyc.routes.js';
import contentLockRoutes from './modules/contentLock/contentLock.routes.js';
import subscriptionRoutes from './modules/user/subscription.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import complianceRoutes from './modules/compliance/compliance.routes.js';
import { startChamaDefaultWorker } from './workers/chamaDefaultWorker.js';
import { ofacScreeningService } from './services/compliance/ofacScreening.service.js';
import { ComplianceCronService } from './services/compliance/compliance.cron.js';
import { trackDeviceFingerprint } from './middleware/compliance.middleware.js';
import { startStoryCleanupWorker } from './workers/storyCleanupWorker.js';
import { startContestDeadlineWorker } from './workers/contestDeadline.worker.js';
import { startDailyPrizeWorker } from './workers/dailyPrizeWorker.js';
import { startFlashSaleWorker } from './workers/flashSaleWorker.js';
import { FCMService } from './services/fcm.service.js';

import { initializeDatabaseMonitorSocket } from './shared/gateway/databaseMonitorSocket.js';
import { initializeShopSocket } from './shared/gateway/shop-socket.js';

const app = express();
const httpServer = createServer(app);
const logger = new Logger('Server');

// Configure Express to trust proxy headers. This is required when the app runs behind a reverse proxy (nginx, load balancer, CDN). It allows Express to correctly extract client IP from X-Forwarded-For header.
app.set('trust proxy', true);

// Socket.io Redis Clustered Gateway for real-time features (milestones, contests, notifications)
const io = initializeGateway(httpServer);



// Initialize Database Monitoring WebSocket (Super Admin only)
const dbMonitorSocket = initializeDatabaseMonitorSocket(httpServer);

// Initialize Shop WebSocket for real-time product updates
initializeShopSocket(io);

// SECURITY: Apply security headers first
app.use(helmetConfig);
app.use(corsConfig);
app.use(additionalSecurityHeaders);

// Global middleware
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
        user_id: userId,
        statusCode: res.statusCode,
      });
    }
  });
  
  next();
});

// SECURITY: Apply global security middleware
app.use(rateLimiter);
app.use(apiRateLimiter); // IP-based rate limiting
app.use(globalRateLimiter); // Redis-backed global rate limiting
app.use(sanitizeInputs); // Input sanitization
app.use(preventPathTraversal); // Prevent path traversal
app.use(preventCommandInjection); // Prevent command injection
app.use(trackDeviceFingerprint); // Track device fingerprints for compliance

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'krieta-api', version: '1.0.0' });
});

// CSRF token endpoint
app.get('/api/v1/csrf-token', authMiddleware, setRLSContext, getCsrfToken);

// SECURITY: Apply RLS context middleware to all authenticated routes
// This sets the PostgreSQL session variable for Row-Level Security
app.use('/api/v1/*', (req, res, next) => {
  // Skip RLS for auth routes (no user context yet)
  if (req.path.startsWith('/auth/')) {
    return next();
  }
  // Skip RLS for webhooks (system operations)
  if (req.path.startsWith('/webhooks/')) {
    return next();
  }
  // Apply new RLS context middleware
  return setRLSContext(req as any, res, next);
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
app.use('/api/v1/admin/ads', adManagementRoutes);
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

app.use('/api/v1/explore', exploreRoutes);
app.use('/api/v1/recommendation', recommendationRoutes);
app.use('/api/v1/escrow', escrowRoutes);
app.use('/api/v1/kyc', kycRoutes);
app.use('/api/v1/display-ads', displayAdsRoutes);
app.use('/api/v1/locations', locationsRoutes);
app.use('/api/v1/creator-boost', creatorBoostRoutes);
app.use('/api/v1/niches', nichesRoutes);
app.use('/api/v1/content-lock', contentLockRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/compliance', complianceRoutes);

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

// Initialize JWT rotation manager and start server
(async () => {
  try {
    await jwtSecretManager.initialize();
    logger.info('JWT Secret Manager initialized');

    httpServer.listen(PORT, async () => {
      logger.info(`Krieta API running on port ${PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`CORS Origin: ${env.CORS_ORIGIN}`);
      
      // Start cron workers
      logger.info('Starting background workers...');
      try {
        // Initialize OFAC screening service
        logger.info('Initializing OFAC screening service...');
        await ofacScreeningService.initialize();
        logger.info('OFAC screening service initialized');
        
        // Initialize compliance cron jobs
        ComplianceCronService.initialize();
        
        startChamaDefaultWorker();
        startStoryCleanupWorker();
        startContestDeadlineWorker();
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
        const { startIdempotencyCleanupWorker } = await import('./workers/idempotencyCleanup.worker.js');
        const { startFinancialSecurityCleanupWorker } = await import('./workers/financialSecurityCleanup.worker.js');
        
        startContentDistributionWorker();
        startMicroInterestWorker();
        startTrendingTopicsWorker();
        SocialMediaSyncWorker.start();
        startWithdrawalLimitResetWorker();
        startNonceCleanupWorker();
        startIdempotencyCleanupWorker();
        startFinancialSecurityCleanupWorker();
        
        logger.info('All workers started successfully');
      } catch (workerError) {
        logger.error('Error starting workers:', { error: workerError instanceof Error ? workerError.message : String(workerError) });
        logger.warn('Continuing without some workers...');
      }
      
      logger.info('Server ready to accept connections');
    });
  } catch (error) {
    logger.fatal('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
})();

export { app, io };
