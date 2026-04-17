import { Request, Response } from 'express';
import { redis } from '../../config/redis.js';

export const getCacheValue = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = req.params.key as string;
    if (!key) {
      res.status(400).json({ error: 'Cache key is required' });
      return;
    }

    const value = await redis.get(key);
    
    if (value === null) {
      res.status(404).json({ error: 'Cache miss', data: null });
      return;
    }

    // Try parsing as JSON if possible, otherwise return string
    try {
      res.json({ data: JSON.parse(value) });
    } catch {
      res.json({ data: value });
    }
  } catch (error) {
    console.error('Redis Get Error:', error);
    res.status(500).json({ error: 'Internal cache error' });
  }
};

export const setCacheValue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, value, ttlSeconds } = req.body;

    if (!key || value === undefined) {
      res.status(400).json({ error: 'Key and value are required' });
      return;
    }

    const valueString = typeof value === 'object' ? JSON.stringify(value) : String(value);

    if (ttlSeconds && typeof ttlSeconds === 'number') {
      await redis.setex(key, ttlSeconds, valueString);
    } else {
      await redis.set(key, valueString);
    }

    res.json({ success: true, message: `Key ${key} cached successfully` });
  } catch (error) {
    console.error('Redis Set Error:', error);
    res.status(500).json({ error: 'Internal cache error' });
  }
};

export const deleteCacheValue = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = req.params.key as string;
    if (!key) {
      res.status(400).json({ error: 'Cache key is required' });
      return;
    }

    await redis.del(key);
    res.json({ success: true, message: `Key ${key} cleared` });
  } catch (error) {
    console.error('Redis Delete Error:', error);
    res.status(500).json({ error: 'Internal cache error' });
  }
};
