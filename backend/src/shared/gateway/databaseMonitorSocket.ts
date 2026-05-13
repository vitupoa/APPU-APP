import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Logger } from '../../utils/logger.js';
import { prisma } from '../../config/database.js';
import { verifyToken } from '../../utils/jwt.js';

const logger = new Logger('DatabaseMonitorSocket');

interface DatabaseStats {
  connections: any[];
  slowQueries: any[];
  indexUsage: any[];
  tableStats: any[];
}

interface PerformanceMetrics {
  cacheHitRatio: any[];
  indexHitRatio: any[];
  locks: any[];
}

interface AlertConfig {
  slowQueryThreshold: number; // ms
  cacheHitRateThreshold: number; // percentage
  indexHitRateThreshold: number; // percentage
  connectionThreshold: number; // count
  enabled: boolean;
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  slowQueryThreshold: 200,
  cacheHitRateThreshold: 80,
  indexHitRateThreshold: 90,
  connectionThreshold: 100,
  enabled: true,
};

let monitoringInterval: NodeJS.Timeout | null = null;
const connectedAdmins = new Map<string, { socket: Socket; alertConfig: AlertConfig }>();

export function initializeDatabaseMonitorSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    path: '/socket.io/database-monitor',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = await verifyToken(token);
      
      // Check if user is super admin
      const user = await prisma.user.findUnique({
        where: { id: decoded.user_id },
        include: { adminProfile: true },
      });

      if (!user?.adminProfile || user.adminProfile.role !== 'SUPER_ADMIN') {
        return next(new Error('Super admin access required'));
      }

      (socket as any).user_id = decoded.user_id;
      (socket as any).user = user;
      
      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error as any);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).user_id;
    logger.info(`Super admin ${userId} connected to database monitor`);

    // Store connected admin with default alert config
    connectedAdmins.set(socket.id, {
      socket,
      alertConfig: { ...DEFAULT_ALERT_CONFIG },
    });

    // Start monitoring if not already running
    if (!monitoringInterval && connectedAdmins.size > 0) {
      startMonitoring(io);
    }

    // Handle alert configuration updates
    socket.on('update-alert-config', (config: Partial<AlertConfig>) => {
      const admin = connectedAdmins.get(socket.id);
      if (admin) {
        admin.alertConfig = { ...admin.alertConfig, ...config };
        connectedAdmins.set(socket.id, admin);
        socket.emit('alert-config-updated', admin.alertConfig);
        logger.info(`Alert config updated for admin ${userId}`, config);
      }
    });

    // Handle request for current alert config
    socket.on('get-alert-config', () => {
      const admin = connectedAdmins.get(socket.id);
      if (admin) {
        socket.emit('alert-config', admin.alertConfig);
      }
    });

    // Handle manual refresh request
    socket.on('refresh-metrics', async () => {
      try {
        const [stats, performance] = await Promise.all([
          fetchDatabaseStats(),
          fetchPerformanceMetrics(),
        ]);
        socket.emit('database-metrics', { stats, performance });
      } catch (error) {
        logger.error('Error fetching metrics on demand:', error as any);
        socket.emit('error', { message: 'Failed to fetch metrics' });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Super admin ${userId} disconnected from database monitor`);
      connectedAdmins.delete(socket.id);

      // Stop monitoring if no admins connected
      if (connectedAdmins.size === 0 && monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        logger.info('Database monitoring stopped - no admins connected');
      }
    });
  });

  logger.info('Database monitoring WebSocket initialized');
  return io;
}

function startMonitoring(io: Server) {
  logger.info('Starting database monitoring...');

  // Fetch and broadcast metrics every 10 seconds
  monitoringInterval = setInterval(async () => {
    try {
      const [stats, performance] = await Promise.all([
        fetchDatabaseStats(),
        fetchPerformanceMetrics(),
      ]);

      // Broadcast to all connected admins
      io.emit('database-metrics', { stats, performance });

      // Check for alerts
      checkAndSendAlerts(stats, performance);
    } catch (error) {
      logger.error('Error in monitoring interval:', error as any);
    }
  }, 10000); // 10 seconds
}

async function fetchDatabaseStats(): Promise<DatabaseStats> {
  const [connections, slowQueries, indexUsage, tableStats] = (await Promise.all([
    prisma.$queryRaw`SELECT count(*) as connections, state FROM pg_stat_activity GROUP BY state`,
    prisma.$queryRaw`
      SELECT query, calls, total_time, mean_time, max_time 
      FROM pg_stat_statements 
      WHERE mean_time > 100 
      ORDER BY mean_time DESC 
      LIMIT 20
    `,
    prisma.$queryRaw`
      SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read 
      FROM pg_stat_user_indexes 
      WHERE idx_scan > 0 
      ORDER BY idx_scan DESC 
      LIMIT 20
    `,
    prisma.$queryRaw`
      SELECT 
        schemaname, 
        tablename, 
        n_live_tup as row_count, 
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size 
      FROM pg_stat_user_tables 
      ORDER BY n_live_tup DESC 
      LIMIT 20
    `,
  ]) as any);

  return { connections, slowQueries, indexUsage, tableStats };
}

async function fetchPerformanceMetrics(): Promise<PerformanceMetrics> {
  const [cacheHitRatio, indexHitRatio, locks] = (await Promise.all([
    prisma.$queryRaw`
      SELECT sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) as cache_hit_ratio 
      FROM pg_statio_user_tables
    `,
    prisma.$queryRaw`
      SELECT sum(idx_blks_hit) / nullif(sum(idx_blks_hit) + sum(idx_blks_read), 0) as index_hit_ratio 
      FROM pg_statio_user_indexes
    `,
    prisma.$queryRaw`
      SELECT locktype, mode, count(*) as count
      FROM pg_locks 
      GROUP BY locktype, mode 
      ORDER BY count DESC
    `,
  ]) as any);

  return { cacheHitRatio, indexHitRatio, locks };
}

function checkAndSendAlerts(stats: DatabaseStats, performance: PerformanceMetrics) {
  connectedAdmins.forEach((admin, socketId) => {
    if (!admin.alertConfig.enabled) return;

    const alerts: any[] = [];

    // Check slow queries
    const slowQueries = stats.slowQueries.filter(
      (q: any) => parseFloat(q.mean_time) > admin.alertConfig.slowQueryThreshold
    );
    if (slowQueries.length > 0) {
      alerts.push({
        type: 'slow_query',
        severity: 'warning',
        message: `${slowQueries.length} slow queries detected (>${admin.alertConfig.slowQueryThreshold}ms)`,
        data: slowQueries.slice(0, 5),
        timestamp: new Date().toISOString(),
      });
    }

    // Check cache hit rate
    const cacheHitRate = performance.cacheHitRatio[0]?.cache_hit_ratio
      ? parseFloat(performance.cacheHitRatio[0].cache_hit_ratio) * 100
      : 0;
    if (cacheHitRate < admin.alertConfig.cacheHitRateThreshold) {
      alerts.push({
        type: 'low_cache_hit_rate',
        severity: cacheHitRate < 70 ? 'critical' : 'warning',
        message: `Cache hit rate is ${cacheHitRate.toFixed(2)}% (threshold: ${admin.alertConfig.cacheHitRateThreshold}%)`,
        data: { cacheHitRate, threshold: admin.alertConfig.cacheHitRateThreshold },
        timestamp: new Date().toISOString(),
      });
    }

    // Check index hit rate
    const indexHitRate = performance.indexHitRatio[0]?.index_hit_ratio
      ? parseFloat(performance.indexHitRatio[0].index_hit_ratio) * 100
      : 0;
    if (indexHitRate < admin.alertConfig.indexHitRateThreshold) {
      alerts.push({
        type: 'low_index_hit_rate',
        severity: indexHitRate < 80 ? 'critical' : 'warning',
        message: `Index hit rate is ${indexHitRate.toFixed(2)}% (threshold: ${admin.alertConfig.indexHitRateThreshold}%)`,
        data: { indexHitRate, threshold: admin.alertConfig.indexHitRateThreshold },
        timestamp: new Date().toISOString(),
      });
    }

    // Check connection count
    const totalConnections = stats.connections.reduce(
      (sum: number, c: any) => sum + parseInt(c.connections),
      0
    );
    if (totalConnections > admin.alertConfig.connectionThreshold) {
      alerts.push({
        type: 'high_connections',
        severity: totalConnections > admin.alertConfig.connectionThreshold * 1.5 ? 'critical' : 'warning',
        message: `High connection count: ${totalConnections} (threshold: ${admin.alertConfig.connectionThreshold})`,
        data: { totalConnections, threshold: admin.alertConfig.connectionThreshold },
        timestamp: new Date().toISOString(),
      });
    }

    // Send alerts if any
    if (alerts.length > 0) {
      admin.socket.emit('database-alerts', alerts);
      logger.warn(`Sent ${alerts.length} alerts to admin`, { socketId, alerts: alerts.map(a => a.type) });
    }
  });
}
