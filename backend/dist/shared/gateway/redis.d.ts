import { Redis } from 'ioredis';
export declare const pubClient: Redis;
export declare const subClient: Redis;
export declare const RedisChannels: {
    readonly NOTIFICATIONS: "krieta:notifications";
    readonly MILESTONES: "krieta:milestones";
    readonly CONTEST_RACE: "krieta:contests";
};
//# sourceMappingURL=redis.d.ts.map