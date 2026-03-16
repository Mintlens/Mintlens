import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../shared/middleware/require-auth.js'
import {
  listProjectsUseCase,
  getProjectUseCase,
  createProjectUseCase,
  listFeaturesWithCostUseCase,
} from '../application/projects.usecase.js'

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
    return (app.csrfProtection as any)(req, reply)
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
