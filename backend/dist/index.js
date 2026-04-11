"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const env_1 = require("./config/env");
const socket_1 = require("./shared/gateway/socket");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const wallet_routes_1 = __importDefault(require("./modules/wallet/wallet.routes"));
const payment_routes_1 = __importDefault(require("./modules/payments/payment.routes"));
const shorts_routes_1 = __importDefault(require("./modules/shorts/shorts.routes"));
const feed_routes_1 = __importDefault(require("./modules/feed/feed.routes"));
const contests_routes_1 = __importDefault(require("./modules/contests/contests.routes"));
const user_routes_1 = __importDefault(require("./modules/user/user.routes"));
const shop_routes_1 = __importDefault(require("./modules/shop/shop.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const ads_routes_1 = __importDefault(require("./modules/ads/ads.routes"));
const cache_routes_1 = __importDefault(require("./modules/cache/cache.routes"));
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
// Socket.io Redis Clustered Gateway for real-time features (milestones, contests, notifications)
const io = (0, socket_1.initializeGateway)(httpServer);
exports.io = io;
// Global middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: env_1.env.CORS_ORIGIN }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(rateLimiter_1.rateLimiter);
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'krieta-api', version: '1.0.0' });
});
// API Routes — mounted as modules are implemented
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/users', user_routes_1.default);
app.use('/api/v1/wallet', wallet_routes_1.default);
app.use('/api/v1/payments', payment_routes_1.default);
app.use('/api/v1/shorts', shorts_routes_1.default);
app.use('/api/v1/feed', feed_routes_1.default);
app.use('/api/v1/contests', contests_routes_1.default);
app.use('/api/v1/shop', shop_routes_1.default);
app.use('/api/v1/analytics', analytics_routes_1.default);
app.use('/api/v1/ads', ads_routes_1.default);
app.use('/api/v1/cache', cache_routes_1.default);
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
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
const PORT = env_1.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Krieta API running on port ${PORT}`);
    console.log(`Environment: ${env_1.env.NODE_ENV}`);
});
//# sourceMappingURL=index.js.map