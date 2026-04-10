"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_TTL = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
exports.redis = new ioredis_1.default(env_1.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        if (times > 3)
            return null;
        return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
});
exports.redis.on('error', (err) => {
    console.error('Redis connection error:', err.message);
});
exports.redis.on('connect', () => {
    console.log('Redis connected');
});
// Cache helpers
exports.CACHE_TTL = {
    EXCHANGE_RATES: 300, // 5 minutes
    USER_PROFILE: 60, // 1 minute
    FEED_PAGE: 30, // 30 seconds
    LEADERBOARD: 15, // 15 seconds
    WALLET_BALANCE: 10, // 10 seconds
};
//# sourceMappingURL=redis.js.map