/**
 * Shared Redis (ioredis) client.
 * All modules import this singleton — avoids multiple connection pools.
 */
import Redis from 'ioredis'
import { logger } from '../logger/logger.js'

export const redis = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
})

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error', (err) => logger.error({ err }, 'Redis error'))
