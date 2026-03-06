/**
 * Per-test setup — runs before each integration test file.
 * Truncates all tables so every test starts with a clean DB state.
 */
import { afterAll, beforeAll, beforeEach } from 'vitest'
import { sql } from 'drizzle-orm'
import { db, pool } from '../shared/infrastructure/db.js'

beforeAll(() => {
    process.env['NODE_ENV'] ??= 'test'
    process.env['JWT_SECRET'] ??= 'integration-test-secret-do-not-use-in-prod'
    process.env['DATABASE_URL'] ??= 'postgresql://mintlens:changeme@localhost:5432/mintlens_dev'
    process.env['REDIS_URL'] ??= 'redis://:changeme@localhost:6379'
})

beforeEach(async () => {
    // Truncate all tables in dependency order (children first, parents last)
    await db.execute(sql`
    TRUNCATE TABLE
      budget_alerts,
      budgets,
      llm_requests,
      tenant_pricing_plans,
      pricing_plans,
      api_keys,
      features,
      tenants,
      projects,
      users,
      organisations
    RESTART IDENTITY CASCADE
  `)
})

afterAll(async () => {
    // Close the pg pool so Vitest can exit cleanly
    await pool.end()
})
