import Fastify from 'fastify'
import { ZodError } from 'zod'
import { logger } from './shared/logger/logger.js'
import { AppError } from './shared/errors/app-errors.js'

export async function buildApp() {
  const app = Fastify({
    logger: false, // We use pino directly
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: () => crypto.randomUUID(),
    trustProxy: true,
  })

  // ── Global error handler ──────────────────────────────────────
  // Registered first so it applies to all plugin sub-scopes (Fastify v4 scoping).
  app.setErrorHandler((error, _request, reply) => {
    // Domain errors (ConflictError, AuthError, NotFoundError, …)
    if (error instanceof AppError && error.isOperational) {
      logger.warn({ err: error, code: error.code }, error.message)
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message },
      })
    }

    // Zod validation errors thrown from route handlers (inline .parse() calls)
    if (error instanceof ZodError) {
      const first = error.errors[0]
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: first ? `${first.path.join('.')}: ${first.message}` : 'Validation error',
        },
      })
    }

    // Fastify's built-in schema validation errors
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
  const { authRoutes }       = await import('./modules/auth/presentation/auth.routes.js')
  const { ingestionRoutes }  = await import('./modules/ingestion/presentation/ingestion.routes.js')
  const { analyticsRoutes }  = await import('./modules/analytics/presentation/analytics.routes.js')
  const { projectsRoutes }   = await import('./modules/projects/presentation/projects.routes.js')
  const { budgetsRoutes }    = await import('./modules/budgets/presentation/budgets.routes.js')

  await app.register(authRoutes,      { prefix: '/v1/auth' })
  await app.register(ingestionRoutes, { prefix: '/v1/events' })
  await app.register(analyticsRoutes, { prefix: '/v1/analytics' })
  await app.register(projectsRoutes,  { prefix: '/v1/projects' })
  await app.register(budgetsRoutes,   { prefix: '/v1/budgets' })

  return app
}
