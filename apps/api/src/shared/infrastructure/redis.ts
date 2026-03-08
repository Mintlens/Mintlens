/**
 * Shared Redis (ioredis) client.
 * All modules import this singleton — avoids multiple connection pools.
 */
import { Redis } from 'ioredis'
import { logger } from '../logger/logger.js'

/** Returns a BullMQ-compatible connection config parsed from REDIS_URL. */
export function getBullMQConnection() {
  const url = process.env['REDIS_URL'] ?? 'redis://localhost:6379'
  const parsed = new URL(url)
  return {
    host:     parsed.hostname,
    port:     Number(parsed.port) || 6379,
    password: parsed.password || undefined,
    db:       parsed.pathname ? Number(parsed.pathname.slice(1)) || 0 : 0,
  }
}

export const redis = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
})

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error', (err: Error) => logger.error({ err }, 'Redis error'))
