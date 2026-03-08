/**
 * Server entry point.
 *
 * Kept separate from app.ts so that buildApp() can be imported in tests
 * without triggering server startup or BullMQ worker initialisation.
 */
import { config } from 'dotenv'
config() // loads apps/api/.env when present; no-op in production (env vars injected by platform)

import { buildApp } from './app.js'
import { logger } from './shared/logger/logger.js'

async function main() {
  try {
    const app = await buildApp()
    const port = Number(process.env['API_PORT'] ?? 3001)
    const host = process.env['API_HOST'] ?? '0.0.0.0'

    // Start BullMQ worker (runs in same process for simplicity; split to a
    // separate Dockerfile target in production if queue throughput requires it)
    const { startLlmEventsWorker } = await import(
      './modules/ingestion/application/process-llm-event.worker.js'
    )
    startLlmEventsWorker()

    const { startBudgetCheckerWorker } = await import(
      './modules/budgets/application/check-budgets.worker.js'
    )
    startBudgetCheckerWorker()

    const { startModelPricingSyncWorker } = await import(
      './modules/ingestion/application/sync-model-pricing.worker.js'
    )
    startModelPricingSyncWorker()

    await app.listen({ port, host })
    logger.info({ port, host }, '🔭 Mintlens API running')
  } catch (err) {
    logger.error({ err }, 'Failed to start server')
    process.exit(1)
  }
}

main()
