import Redis from 'ioredis';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

let client = null;
let connectFailed = false;

const getClient = () => {
  if (!config.redisUrl) return null;
  if (connectFailed) return null;
  if (client) return client;
  try {
    client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    client.on('error', (err) => {
      logger.warn({ err: err.message }, 'Redis client error');
    });
    return client;
  } catch (err) {
    connectFailed = true;
    logger.warn({ err: err.message }, 'Redis init failed');
    return null;
  }
};

const cacheGetJson = async (key) => {
  const redis = getClient();
  if (!redis) return null;
  try {
    if (redis.status === 'wait') await redis.connect();
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const cacheSetJson = async (key, value, ttlSeconds) => {
  const redis = getClient();
  if (!redis) return;
  try {
    if (redis.status === 'wait') await redis.connect();
    const payload = JSON.stringify(value);
    const ttl = Math.max(1, Number(ttlSeconds) || 60);
    await redis.set(key, payload, 'EX', ttl);
  } catch {}
};

const cacheDel = async (key) => {
  const redis = getClient();
  if (!redis) return;
  try {
    if (redis.status === 'wait') await redis.connect();
    await redis.del(key);
  } catch {}
};

const predictCacheKey = (userId, rangeKey) => {
  const r = rangeKey || 'all';
  return `fde:predict:${userId}:${r}`;
};

const dashboardCacheKey = (userId, rangeKey) => {
  const r = rangeKey || 'all';
  return `fde:dashboard:${userId}:${r}`;
};

const RANGE_KEYS = ['all', '7d', '30d', '90d'];

const bustUserCaches = async (userId) => {
  for (const r of RANGE_KEYS) {
    await cacheDel(predictCacheKey(userId, r));
    await cacheDel(dashboardCacheKey(userId, r));
  }
};

export {
  cacheGetJson,
  cacheSetJson,
  cacheDel,
  predictCacheKey,
  dashboardCacheKey,
  bustUserCaches,
};
