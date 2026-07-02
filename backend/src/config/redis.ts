import Redis from 'ioredis';
import { getEnv } from './env';

const env = getEnv();

function createRedisOptions(maxRetriesPerRequest: number | null): Record<string, unknown> {
  const base = {
    maxRetriesPerRequest,
    connectTimeout: 5000,
    lazyConnect: true,
  };
  if (env.REDIS_URL) {
    return { ...base };
  }
  return {
    ...base,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
    enableReadyCheck: true,
  };
}

export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, createRedisOptions(3) as any)
  : new Redis(createRedisOptions(3) as any);

export const redisWorker = env.REDIS_URL
  ? new Redis(env.REDIS_URL, createRedisOptions(null) as any)
  : new Redis(createRedisOptions(null) as any);

redis.on('connect', () => console.log('?? Redis connected'));
redis.on('error', (err) => console.error('? Redis error:', err));
redis.on('close', () => console.warn('?? Redis connection closed'));

export async function connectRedis(): Promise<void> {
  if (redis.status === 'wait') {
    await redis.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}
