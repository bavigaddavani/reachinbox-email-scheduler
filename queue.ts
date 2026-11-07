import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const createRedisConnection = () => {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
  });
};

export const emailQueue = new Queue('email-queue', {
  connection: createRedisConnection(),
});
