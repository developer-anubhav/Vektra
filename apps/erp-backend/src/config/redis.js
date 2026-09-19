import Redis from "ioredis";

let redisClient = null;
let isRedisConnected = false;

// Native In-Memory fallback map when Redis server is offline
const inMemoryCache = new Map();

const initRedis = () => {
  try {
    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy(times) {
        if (times > 3) {
          console.warn("[Redis] Server unreachable. Operating with high-performance in-memory cache fallback.");
          return null; // Stop retrying
        }
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on("connect", () => {
      isRedisConnected = true;
      console.log("⚡ [Redis] Connected successfully to Redis server.");
    });

    redisClient.on("error", (err) => {
      isRedisConnected = false;
      // Silent warning to avoid cluttering logs on environment without running Redis service
    });

    redisClient.connect().catch(() => {
      isRedisConnected = false;
    });
  } catch (err) {
    isRedisConnected = false;
    console.warn("[Redis] Initialization failed, using in-memory cache fallback.");
  }
};

initRedis();

export const getCache = async (key) => {
  if (isRedisConnected && redisClient) {
    try {
      const data = await redisClient.get(key);
      if (data) return JSON.parse(data);
    } catch (err) {
      isRedisConnected = false;
    }
  }

  // Fallback to in-memory cache
  const cached = inMemoryCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }
  return null;
};

export const setCache = async (key, value, ttlSeconds = 60) => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
      return;
    } catch (err) {
      isRedisConnected = false;
    }
  }

  // Fallback to in-memory cache
  inMemoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
};

export const deleteCache = async (key) => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.del(key);
    } catch (err) {
      isRedisConnected = false;
    }
  }
  inMemoryCache.delete(key);
};

export const invalidateTenantCache = async (companyId) => {
  if (!companyId) return;
  const key = `analytics:${companyId.toString()}`;
  await deleteCache(key);
};

export const getRedisClient = () => redisClient;

export const acquireCooldownLock = async (employeeId, ttlMs = 10000) => {
  const key = `cooldown:${employeeId}`;
  if (isRedisConnected && redisClient) {
    try {
      const res = await redisClient.set(key, "1", "PX", ttlMs, "NX");
      return res === "OK";
    } catch (err) {
      isRedisConnected = false;
    }
  }

  // Fallback to in-memory cache when Redis is offline
  const nowMs = Date.now();
  const cached = inMemoryCache.get(key);
  const lastScanMs = typeof cached === "number" ? cached : (cached?.expiresAt ? cached.expiresAt - ttlMs : (cached?.value ? cached.value : 0));
  if (nowMs - lastScanMs < ttlMs) {
    return false;
  }
  inMemoryCache.set(key, nowMs);
  return true;
};

