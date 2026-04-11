"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCacheValue = exports.setCacheValue = exports.getCacheValue = void 0;
const redis_1 = require("../../config/redis");
const getCacheValue = async (req, res) => {
    try {
        const key = req.params.key;
        if (!key) {
            res.status(400).json({ error: 'Cache key is required' });
            return;
        }
        const value = await redis_1.redis.get(key);
        if (value === null) {
            res.status(404).json({ error: 'Cache miss', data: null });
            return;
        }
        // Try parsing as JSON if possible, otherwise return string
        try {
            res.json({ data: JSON.parse(value) });
        }
        catch {
            res.json({ data: value });
        }
    }
    catch (error) {
        console.error('Redis Get Error:', error);
        res.status(500).json({ error: 'Internal cache error' });
    }
};
exports.getCacheValue = getCacheValue;
const setCacheValue = async (req, res) => {
    try {
        const { key, value, ttlSeconds } = req.body;
        if (!key || value === undefined) {
            res.status(400).json({ error: 'Key and value are required' });
            return;
        }
        const valueString = typeof value === 'object' ? JSON.stringify(value) : String(value);
        if (ttlSeconds && typeof ttlSeconds === 'number') {
            await redis_1.redis.setex(key, ttlSeconds, valueString);
        }
        else {
            await redis_1.redis.set(key, valueString);
        }
        res.json({ success: true, message: `Key ${key} cached successfully` });
    }
    catch (error) {
        console.error('Redis Set Error:', error);
        res.status(500).json({ error: 'Internal cache error' });
    }
};
exports.setCacheValue = setCacheValue;
const deleteCacheValue = async (req, res) => {
    try {
        const key = req.params.key;
        if (!key) {
            res.status(400).json({ error: 'Cache key is required' });
            return;
        }
        await redis_1.redis.del(key);
        res.json({ success: true, message: `Key ${key} cleared` });
    }
    catch (error) {
        console.error('Redis Delete Error:', error);
        res.status(500).json({ error: 'Internal cache error' });
    }
};
exports.deleteCacheValue = deleteCacheValue;
//# sourceMappingURL=cache.controller.js.map