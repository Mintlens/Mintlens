import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../shared/middleware/require-auth.js'
import { validateBody } from '../../../shared/middleware/validate-body.js'
import { createBudgetBody, listBudgetsQuery, type CreateBudgetBody } from './budgets.schemas.js'
import { createBudgetUseCase } from '../application/create-budget.usecase.js'
import { listBudgetsUseCase, deleteBudgetUseCase } from '../application/list-budgets.usecase.js'

const budgetParams = z.object({ budgetId: z.string().uuid() })

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export async function budgetsRoutes(app: FastifyInstance) {
  // CSRF protection — only on state-mutating methods (POST, PUT, DELETE …)
  app.addHook('onRequest', async (req, reply) => {
    if (SAFE_METHODS.has(req.method)) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (app.csrfProtection as any)(req, reply)
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
}
