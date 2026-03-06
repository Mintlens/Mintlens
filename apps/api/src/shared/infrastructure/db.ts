/**
 * Drizzle ORM database client.
 * Uses a node-postgres Pool for connection management.
 */
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '#schema'
import { logger } from '../logger/logger.js'

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
  max: Number(process.env['DB_POOL_MAX'] ?? 20),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  logger.error({ err }, 'PostgreSQL pool error')
})

export const db = drizzle(pool, { schema })
export { pool }

export type Database = typeof db
