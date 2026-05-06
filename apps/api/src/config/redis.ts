import { Redis } from "ioredis";
import { env } from "./env.js";

type CacheBackend = "redis" | "memory";

type MemoryEntry = {
  value: string;
  expiresAt: number;
};

const memoryCache = new Map<string, MemoryEntry>();
let backend: CacheBackend = "memory";

export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true
    })
  : null;

const pruneMemoryKey = (key: string) => {
  const item = memoryCache.get(key);
  if (!item) {
    return null;
  }

  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return item.value;
};

export const connectRedis = async () => {
  if (!redis) {
    backend = "memory";
    return;
  }

  try {
    await redis.connect();
    backend = "redis";
  } catch {
    backend = "memory";
  }
};

export const getCacheHealth = () => ({
  backend,
  connected: backend === "redis"
});

export const safeRedisGet = async (key: string) => {
  if (backend === "redis" && redis) {
    try {
      return await redis.get(key);
    } catch {
      backend = "memory";
    }
  }

  return pruneMemoryKey(key);
};

export const safeRedisSet = async (key: string, value: string, ttlSeconds = 20) => {
  if (backend === "redis" && redis) {
    try {
      await redis.set(key, value, "EX", ttlSeconds);
      return;
    } catch {
      backend = "memory";
    }
  }

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
};

export const safeRedisDel = async (...keys: string[]) => {
  if (!keys.length) {
    return;
  }

  if (backend === "redis" && redis) {
    try {
      await redis.del(...keys);
      return;
    } catch {
      backend = "memory";
    }
  }

  for (const key of keys) {
    memoryCache.delete(key);
  }
};
