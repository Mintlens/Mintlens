import type { FastifyInstance } from 'fastify'
import { signupUseCase } from '../application/signup.usecase.js'
import { loginUseCase } from '../application/login.usecase.js'
import { generateApiKeyUseCase } from '../application/generate-api-key.usecase.js'
import { requireAuth } from '../../../shared/middleware/require-auth.js'
import { validateBody } from '../../../shared/middleware/validate-body.js'
import {
  signupBody,
  loginBody,
  generateApiKeyBody,
  type SignupBody,
  type LoginBody,
  type GenerateApiKeyBody,
} from './auth.schemas.js'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

export async function authRoutes(app: FastifyInstance) {
  /**
   * POST /v1/auth/signup
   * Creates organisation + owner user, sets access_token cookie.
   */
  app.post<{ Body: SignupBody }>('/signup', {
    schema: { body: signupBody, tags: ['Auth'], summary: 'Create account & organisation' },
    preHandler: [validateBody(signupBody)],
  }, async (req, reply) => {
    const tokens = await signupUseCase(req.body)
    reply.setCookie('access_token', tokens.accessToken, COOKIE_OPTS)
    return reply.status(201).send({
      data: { expiresAt: tokens.expiresAt },
    })
  })

  /**
   * POST /v1/auth/login
   * Returns access_token as httpOnly cookie.
   */
  app.post<{ Body: LoginBody }>('/login', {
    schema: { body: loginBody, tags: ['Auth'], summary: 'Login with email & password' },
    preHandler: [validateBody(loginBody)],
  }, async (req, reply) => {
    const tokens = await loginUseCase(req.body)
    reply.setCookie('access_token', tokens.accessToken, COOKIE_OPTS)
    return reply.send({
      data: { expiresAt: tokens.expiresAt },
    })
  })

  /**
   * POST /v1/auth/logout
   * Clears the access_token cookie.
   */
  app.post('/logout', {
    schema: { tags: ['Auth'], summary: 'Logout (clears cookie)' },
  }, async (_req, reply) => {
    reply.clearCookie('access_token', { path: '/' })
    return reply.send({ data: null })
  })

  /**
   * POST /v1/auth/api-keys
   * Generates a new SDK API key for a project.
   * Requires a valid session JWT (cookie).
   */
  app.post<{ Body: GenerateApiKeyBody }>(
    '/api-keys',
    {
      schema: {
        body: generateApiKeyBody,
        tags: ['Auth'],
        summary: 'Generate SDK API key',
        security: [{ cookieAuth: [] }],
      },
      preHandler: [requireAuth, validateBody(generateApiKeyBody)],
    },
    async (req, reply) => {
      const { organisationId } = req.user!
      const body = req.body
      const result = await generateApiKeyUseCase(organisationId, {
        projectId: body.projectId,
        name:      body.name,
        ...(body.scopes    !== undefined ? { scopes:    body.scopes }    : {}),
        ...(body.expiresAt !== undefined ? { expiresAt: body.expiresAt } : {}),
      })

      // rawKey shown ONCE — never retrievable again
      return reply.status(201).send({
        data: {
          keyId: result.keyId,
          keyPrefix: result.keyPrefix,
          rawKey: result.rawKey,
          warning: 'Save this key — it will not be shown again.',
        },
      })
    },
  )
}
