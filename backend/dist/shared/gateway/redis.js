"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisChannels = exports.subClient = exports.pubClient = void 0;
const ioredis_1 = require("ioredis");
const env_1 = require("../../config/env");
exports.pubClient = new ioredis_1.Redis(env_1.env.REDIS_URL);
exports.subClient = exports.pubClient.duplicate();
exports.pubClient.on('error', (err) => {
    console.error('[Redis PubClient] Error:', err);
});
exports.subClient.on('error', (err) => {
    console.error('[Redis SubClient] Error:', err);
});
exports.RedisChannels = {
    NOTIFICATIONS: 'krieta:notifications',
    MILESTONES: 'krieta:milestones',
    CONTEST_RACE: 'krieta:contests', // Used for race conditions/leaderboard gateways
};
//# sourceMappingURL=redis.js.map