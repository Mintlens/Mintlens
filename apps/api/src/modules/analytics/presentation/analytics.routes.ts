import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../shared/middleware/require-auth.js'
import { getSummaryUseCase } from '../application/get-summary.usecase.js'
import { getCostExplorerUseCase } from '../application/get-cost-explorer.usecase.js'
import { getTenantsOverviewUseCase } from '../application/get-tenants-overview.usecase.js'
import { summaryQuery, costExplorerQuery, tenantsOverviewQuery } from './analytics.schemas.js'
import { microToUsd } from '../../ingestion/application/cost-calculator.js'
import { ValidationError } from '../../../shared/errors/app-errors.js'

const withProject = z.object({ projectId: z.string().uuid() })

export async function analyticsRoutes(app: FastifyInstance) {
  /**
   * GET /v1/analytics/summary?projectId=&from=&to=
   * KPI cards: total cost, tokens, requests, avg latency, %-change vs prior period.
   */
  app.get('/summary', { preHandler: [requireAuth] }, async (req, reply) => {
    const q = withProject.merge(summaryQuery).parse(req.query)

    const rangeMs = q.to.getTime() - q.from.getTime()
    const previous = { from: new Date(q.from.getTime() - rangeMs), to: q.from }

    const summary = await getSummaryUseCase(q.projectId, { from: q.from, to: q.to }, previous)

    return reply.send({
      data: {
        ...summary,
        totalCostUsd: microToUsd(summary.totalCostMicro),
      },
    })
  })

  /**
   * GET /v1/analytics/cost-explorer?projectId=&from=&to=&granularity=day&...
   * Time series + breakdowns by model, feature, provider.
   */
  app.get('/cost-explorer', { preHandler: [requireAuth] }, async (req, reply) => {
    const q = withProject.merge(costExplorerQuery).parse(req.query)

    const result = await getCostExplorerUseCase({
      projectId:   q.projectId,
      from:        q.from,
      to:          q.to,
      featureKey:  q.featureKey,
      tenantId:    q.tenantId,
      provider:    q.provider,
      model:       q.model,
      environment: q.environment,
      granularity: q.granularity,
    })

    return reply.send({ data: result })
  })

  /**
   * GET /v1/analytics/tenants?projectId=&from=&to=&limit=&offset=
   * Per-tenant: cost, estimated revenue, gross margin, last activity.
   */
  app.get('/tenants', { preHandler: [requireAuth] }, async (req, reply) => {
    const q = withProject.merge(tenantsOverviewQuery).parse(req.query)

    const tenants = await getTenantsOverviewUseCase(
      q.projectId, q.from, q.to, q.limit, q.offset,
    )

    return reply.send({ data: tenants })
  })
}
