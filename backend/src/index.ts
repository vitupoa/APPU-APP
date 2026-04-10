import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import authRoutes from './modules/auth/auth.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import paymentRoutes from './modules/payments/payment.routes';
import shortsRoutes from './modules/shorts/shorts.routes';
import feedRoutes from './modules/feed/feed.routes';
import contestsRoutes from './modules/contests/contests.routes';
import userRoutes from './modules/user/user.routes';
import shopRoutes from './modules/shop/shop.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import adsRoutes from './modules/ads/ads.routes';
import cacheRoutes from './modules/cache/cache.routes';

const app = express();
const httpServer = createServer(app);

// Socket.io for real-time features (milestones, contests, notifications)
const io = new SocketServer(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

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
app.use('/api/v1/cache', cacheRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

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
});

export { app, io };
