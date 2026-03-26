import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../shared/middleware/require-auth.js'
import {
  listProjectsUseCase,
  getProjectUseCase,
  createProjectUseCase,
  updateProjectUseCase,
  deleteProjectUseCase,
  listFeaturesWithCostUseCase,
} from '../application/projects.usecase.js'
import { getOrgPlanTier } from '../../../shared/middleware/require-plan.js'
import { getPlanLimits } from '../../billing/domain/plan-limits.js'
import { PlanLimitExceededError } from '../../../shared/errors/app-errors.js'

const projectParams = z.object({ projectId: z.string().uuid() })

const createProjectBody = z.object({
  name:        z.string().min(2).max(100),
  environment: z.enum(['production', 'staging', 'development']).optional(),
})

const dateRangeQuery = z.object({
  from: z.string().datetime({ offset: true }).optional().transform((v) => {
    if (v) return new Date(v)
    const d = new Date(); d.setDate(d.getDate() - 30); return d
  }),
  to: z.string().datetime({ offset: true }).optional().transform((v) =>
    v ? new Date(v) : new Date(),
  ),
})

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export async function projectsRoutes(app: FastifyInstance) {
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
   * GET /v1/projects
   * List all projects for the authenticated organisation.
   */
  app.get('/', {
    schema: { tags: ['Projects'], summary: 'List projects', security: [{ cookieAuth: [] }] },
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const { organisationId } = req.user!
    const list = await listProjectsUseCase(organisationId)
    return reply.send({ data: list })
  })

  /**
   * POST /v1/projects
   * Create a new project.
   */
  app.post('/', {
    schema: { body: createProjectBody, tags: ['Projects'], summary: 'Create a project', security: [{ cookieAuth: [] }] },
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const { organisationId } = req.user!

    // Check project count against plan limit
    const planTier = await getOrgPlanTier(organisationId)
    const limits = getPlanLimits(planTier)
    if (limits.maxProjects > 0) {
      const existing = await listProjectsUseCase(organisationId)
      if (existing.length >= limits.maxProjects) {
        throw new PlanLimitExceededError('projects', limits.maxProjects)
      }
    }

    const body = createProjectBody.parse(req.body)
    const project = await createProjectUseCase(organisationId, {
      name: body.name,
      ...(body.environment !== undefined ? { environment: body.environment } : {}),
    })
    return reply.status(201).send({ data: project })
  })

  /**
   * GET /v1/projects/:projectId
   * Get a single project.
   */
  app.get<{ Params: { projectId: string } }>(
    '/:projectId',
    {
      schema: { params: projectParams, tags: ['Projects'], summary: 'Get a project', security: [{ cookieAuth: [] }] },
      preHandler: [requireAuth],
    },
    async (req, reply) => {
      const { organisationId } = req.user!
      const project = await getProjectUseCase(organisationId, req.params.projectId)
      return reply.send({ data: project })
    },
  )

  /**
   * PATCH /v1/projects/:projectId
   * Update a project (name, environment).
   */
  app.patch<{ Params: { projectId: string } }>(
    '/:projectId',
    {
      schema: { params: projectParams, tags: ['Projects'], summary: 'Update a project', security: [{ cookieAuth: [] }] },
      preHandler: [requireAuth],
    },
    async (req, reply) => {
      const { organisationId } = req.user!
      const body = z.object({
        name: z.string().min(2).max(100).optional(),
        environment: z.enum(['production', 'staging', 'development']).optional(),
      }).parse(req.body)
      const updated = await updateProjectUseCase(organisationId, req.params.projectId, body)
      return reply.send({ data: updated })
    },
  )

  /**
   * DELETE /v1/projects/:projectId
   * Soft-delete a project (sets deletedAt).
   */
  app.delete<{ Params: { projectId: string } }>(
    '/:projectId',
    {
      schema: { params: projectParams, tags: ['Projects'], summary: 'Delete a project', security: [{ cookieAuth: [] }] },
      preHandler: [requireAuth],
    },
    async (req, reply) => {
      const { organisationId } = req.user!
      await deleteProjectUseCase(organisationId, req.params.projectId)
      return reply.status(204).send()
    },
  )

  /**
   * GET /v1/projects/:projectId/features?from=&to=
   * List features with their cumulative cost in the given period.
   */
  app.get<{ Params: { projectId: string } }>(
    '/:projectId/features',
    {
      schema: { params: projectParams, tags: ['Projects'], summary: 'List features with cost', security: [{ cookieAuth: [] }] },
      preHandler: [requireAuth],
    },
    async (req, reply) => {
      const { organisationId } = req.user!
      const q = dateRangeQuery.parse(req.query)
      const features = await listFeaturesWithCostUseCase(
        organisationId,
        req.params.projectId,
        q.from,
        q.to,
      )
      return reply.send({ data: features })
    },
  )
}
