import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../shared/middleware/require-auth.js'
import { validateBody } from '../../../shared/middleware/validate-body.js'
import { createBudgetBody, listBudgetsQuery, type CreateBudgetBody } from './budgets.schemas.js'
import { createBudgetUseCase } from '../application/create-budget.usecase.js'
import { listBudgetsUseCase, deleteBudgetUseCase } from '../application/list-budgets.usecase.js'
import { listAlertsUseCase, markAlertReadUseCase } from '../application/list-alerts.usecase.js'
import { getOrgPlanTier } from '../../../shared/middleware/require-plan.js'
import { getPlanLimits } from '../../billing/domain/plan-limits.js'
import { PlanLimitExceededError, PlanUpgradeRequiredError } from '../../../shared/errors/app-errors.js'

const budgetParams = z.object({ budgetId: z.string().uuid() })

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export async function budgetsRoutes(app: FastifyInstance) {
  // CSRF protection — only on state-mutating methods (POST, PUT, DELETE …)
  app.addHook('onRequest', async (req, reply) => {
    if (SAFE_METHODS.has(req.method)) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await new Promise<void>((resolve, reject) => {
      (app.csrfProtection as any)(req, reply, (err: Error | undefined) => {
        err ? reject(err) : resolve()
      })
    })
  })

  /**
   * POST /v1/budgets
   * Creates a spend budget for a project (optionally scoped to tenant/feature).
   */
  app.post<{ Body: CreateBudgetBody }>(
    '/',
    {
      schema: { body: createBudgetBody, tags: ['Budgets'], summary: 'Create a budget', security: [{ cookieAuth: [] }] },
      preHandler: [requireAuth, validateBody(createBudgetBody)],
    },
    async (req, reply) => {
      const { organisationId } = req.user!
      const body = req.body

      // Check plan limits
      const planTier = await getOrgPlanTier(organisationId)
      const limits = getPlanLimits(planTier)

      // Kill switch requires Pro+
      if (body.killSwitchEnabled && !limits.killSwitch) {
        throw new PlanUpgradeRequiredError(planTier, 'pro')
      }

      // Budget count limit
      if (limits.maxBudgets > 0) {
        const existing = await listBudgetsUseCase(organisationId, body.projectId)
        if (existing.length >= limits.maxBudgets) {
          throw new PlanLimitExceededError('budgets', limits.maxBudgets)
        }
      }

      const budget = await createBudgetUseCase(organisationId, {
        projectId:  body.projectId,
        name:       body.name,
        scope:      body.scope,
        limitMicro: body.limitMicro,
        period:     body.period,
        ...(body.killSwitchEnabled !== undefined ? { killSwitchEnabled: body.killSwitchEnabled } : {}),
        ...(body.alertThresholds   !== undefined ? { alertThresholds:   body.alertThresholds }   : {}),
        ...(body.tenantId          !== undefined ? { tenantId:          body.tenantId }          : {}),
        ...(body.featureId         !== undefined ? { featureId:         body.featureId }         : {}),
      })
      return reply.status(201).send({ data: budget })
    },
  )

  /**
   * GET /v1/budgets?projectId=
   * Lists all active budgets for a project with current spend from Redis.
   */
  app.get('/', {
    schema: { tags: ['Budgets'], summary: 'List active budgets for a project', security: [{ cookieAuth: [] }] },
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const { organisationId } = req.user!
    const q = listBudgetsQuery.parse(req.query)
    const budgets = await listBudgetsUseCase(organisationId, q.projectId)
    return reply.send({ data: budgets })
  })

  /**
   * DELETE /v1/budgets/:budgetId
   * Soft-deletes (deactivates) a budget.
   */
  app.delete<{ Params: { budgetId: string } }>(
    '/:budgetId',
    {
      schema: { params: budgetParams, tags: ['Budgets'], summary: 'Deactivate a budget', security: [{ cookieAuth: [] }] },
      preHandler: [requireAuth],
    },
    async (req, reply) => {
      const { organisationId } = req.user!
      await deleteBudgetUseCase(organisationId, req.params.budgetId)
      return reply.status(204).send()
    },
  )

  /**
   * GET /v1/budgets/alerts?limit=&offset=
   * Lists budget alerts for the organisation, newest first.
   */
  app.get('/alerts', {
    schema: { tags: ['Budgets'], summary: 'List budget alerts', security: [{ cookieAuth: [] }] },
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const { organisationId } = req.user!
    const q = z.object({
      limit: z.coerce.number().int().min(1).max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0),
    }).parse(req.query)
    const result = await listAlertsUseCase(organisationId, q.limit, q.offset)
    return reply.send({ data: result })
  })

  /**
   * PATCH /v1/budgets/alerts/:alertId/read
   * Marks a single alert as read.
   */
  app.patch<{ Params: { alertId: string } }>(
    '/alerts/:alertId/read',
    {
      schema: { tags: ['Budgets'], summary: 'Mark alert as read', security: [{ cookieAuth: [] }] },
      preHandler: [requireAuth],
    },
    async (req, reply) => {
      const { organisationId } = req.user!
      const { alertId } = z.object({ alertId: z.string().uuid() }).parse(req.params)
      await markAlertReadUseCase(organisationId, alertId)
      return reply.send({ data: null })
    },
  )
}
