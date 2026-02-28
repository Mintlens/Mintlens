import Fastify from 'fastify'
import { logger } from './shared/logger/logger.js'

export async function buildApp() {
  const app = Fastify({
    logger: false, // We use pino directly
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: () => crypto.randomUUID(),
    trustProxy: true,
  })

  // ── Plugins ───────────────────────────────────────────────────
  const { default: helmet }    = await import('@fastify/helmet')
  const { default: cors }      = await import('@fastify/cors')
  const { default: cookie }    = await import('@fastify/cookie')
  const { default: rateLimit } = await import('@fastify/rate-limit')

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
    hsts: { maxAge: 31_536_000, includeSubDomains: true },
  })

  await app.register(cors, {
    origin: process.env['ALLOWED_ORIGINS']?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  })

  await app.register(cookie)

  await app.register(rateLimit, {
    global: true,
    max: 1000,
    timeWindow: '1 minute',
    keyGenerator: (req) => (req.headers['x-api-key'] as string) ?? req.ip,
  })

  // ── Health check ─────────────────────────────────────────────
  app.get('/health', { logLevel: 'silent' }, async () => ({
    status: 'ok',
    version: process.env['npm_package_version'] ?? '0.1.0',
    timestamp: new Date().toISOString(),
  }))

  // ── Routes ────────────────────────────────────────────────────
  const { authRoutes }      = await import('./modules/auth/presentation/auth.routes.js')
  const { ingestionRoutes } = await import('./modules/ingestion/presentation/ingestion.routes.js')

  await app.register(authRoutes,      { prefix: '/v1/auth' })
  await app.register(ingestionRoutes, { prefix: '/v1/events' })

  // ── Global error handler ──────────────────────────────────────
  const { AppError } = await import('./shared/errors/app-errors.js')

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError && error.isOperational) {
      logger.warn({ err: error, code: error.code }, error.message)
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message },
      })
    }

    // Zod / Fastify validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: error.message },
      })
    }

    logger.error({ err: error }, 'Unexpected error')
    return reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    })
  })

  return app
}

// ── Bootstrap ────────────────────────────────────────────────────
async function main() {
  try {
    const app = await buildApp()
    const port = Number(process.env['API_PORT'] ?? 3001)
    const host = process.env['API_HOST'] ?? '0.0.0.0'

    // Start BullMQ worker (runs in same process for simplicity; split to separate
    // Dockerfile target in production if queue throughput requires it)
    const { startLlmEventsWorker } = await import(
      './modules/ingestion/application/process-llm-event.worker.js'
    )
    startLlmEventsWorker()

    await app.listen({ port, host })
    logger.info({ port, host }, '🔭 Mintlens API running')
  } catch (err) {
    logger.error({ err }, 'Failed to start server')
    process.exit(1)
  }
}

main()
