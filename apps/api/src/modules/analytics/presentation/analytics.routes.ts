import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../shared/middleware/require-auth.js'
import { getSummaryUseCase } from '../application/get-summary.usecase.js'
import { getCostExplorerUseCase } from '../application/get-cost-explorer.usecase.js'
import { getTenantsOverviewUseCase } from '../application/get-tenants-overview.usecase.js'
import { getRequestsUseCase } from '../application/get-requests.usecase.js'
import { summaryQuery, costExplorerQuery, tenantsOverviewQuery, requestsQuery } from './analytics.schemas.js'
import { microToUsd } from '../../ingestion/application/cost-calculator.js'

const withProject = z.object({ projectId: z.string().uuid() })
const withOptionalProject = z.object({ projectId: z.string().uuid().optional() })

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export async function analyticsRoutes(app: FastifyInstance) {
  // CSRF protection — only on state-mutating methods (POST, PUT, DELETE …)
  app.addHook('onRequest', async (req, reply) => {
    if (SAFE_METHODS.has(req.method)) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (app.csrfProtection as any)(req, reply)
  })

  /**
   * GET /v1/analytics/summary?from=&to=  (org-wide)
   * GET /v1/analytics/summary?projectId=&from=&to=  (per-project)
   * KPI cards: total cost, tokens, requests, avg latency, %-change vs prior period.
   */
  app.get('/summary', {
    schema: { tags: ['Analytics'], summary: 'KPI summary (cost, tokens, requests, latency)', security: [{ cookieAuth: [] }] },
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const q = withOptionalProject.merge(summaryQuery).parse(req.query)
    const { organisationId } = req.user!

    const rangeMs = q.to.getTime() - q.from.getTime()
    const previous = { from: new Date(q.from.getTime() - rangeMs), to: q.from }

    const scope = q.projectId
      ? { projectId: q.projectId }
      : { organisationId }

    const summary = await getSummaryUseCase(scope, { from: q.from, to: q.to }, previous)

    return reply.send({
      data: {
        ...summary,
        totalCostUsd: microToUsd(summary.totalCostMicro),
      },
    })
  })

  /**
   * GET /v1/analytics/cost-explorer?from=&to=&granularity=day  (org-wide)
   * GET /v1/analytics/cost-explorer?projectId=&from=&to=&granularity=day&...  (per-project)
   * Time series + breakdowns by model, feature, provider.
   */
  app.get('/cost-explorer', {
    schema: { tags: ['Analytics'], summary: 'Cost time-series with breakdowns', security: [{ cookieAuth: [] }] },
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const q = withOptionalProject.merge(costExplorerQuery).parse(req.query)
    const { organisationId } = req.user!

    const result = await getCostExplorerUseCase({
      ...(q.projectId ? { projectId: q.projectId } : { organisationId }),
      from:        q.from,
      to:          q.to,
      granularity: q.granularity,
      ...(q.featureKey  !== undefined ? { featureKey:  q.featureKey }  : {}),
      ...(q.tenantId    !== undefined ? { tenantId:    q.tenantId }    : {}),
      ...(q.provider    !== undefined ? { provider:    q.provider }    : {}),
      ...(q.model       !== undefined ? { model:       q.model }       : {}),
      ...(q.environment !== undefined ? { environment: q.environment } : {}),
    })

    return reply.send({ data: result })
  })

  /**
   * GET /v1/analytics/tenants?projectId=&from=&to=&limit=&offset=
   * Per-tenant: cost, estimated revenue, gross margin, last activity.
   */
  app.get('/tenants', {
    schema: { tags: ['Analytics'], summary: 'Per-tenant cost & revenue overview', security: [{ cookieAuth: [] }] },
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const q = withOptionalProject.merge(tenantsOverviewQuery).parse(req.query)
    const { organisationId } = req.user!

    const scope = q.projectId
      ? { projectId: q.projectId }
      : { organisationId }

    const tenants = await getTenantsOverviewUseCase(scope, q.from, q.to, q.limit, q.offset)

    return reply.send({ data: tenants })
  })

  /**
   * GET /v1/analytics/requests?projectId=&from=&to=&limit=&offset=&provider=&...
   * Paginated list of individual LLM requests with filters.
   */
  app.get('/requests', {
    schema: { tags: ['Analytics'], summary: 'Paginated LLM request logs', security: [{ cookieAuth: [] }] },
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const q = withOptionalProject.merge(requestsQuery).parse(req.query)
    const { organisationId } = req.user!

    const result = await getRequestsUseCase({
      ...(q.projectId ? { projectId: q.projectId } : { organisationId }),
      from:        q.from,
      to:          q.to,
      limit:       q.limit,
      offset:      q.offset,
      ...(q.provider    !== undefined ? { provider:    q.provider }    : {}),
      ...(q.model       !== undefined ? { model:       q.model }       : {}),
      ...(q.featureKey  !== undefined ? { featureKey:  q.featureKey }  : {}),
      ...(q.tenantId    !== undefined ? { tenantId:    q.tenantId }    : {}),
      ...(q.environment !== undefined ? { environment: q.environment } : {}),
    })

    return reply.send({ data: result })
  })
}
