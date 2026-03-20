import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../shared/middleware/require-auth.js'
import { listMembersUseCase } from '../application/list-members.usecase.js'
import { inviteMemberUseCase } from '../application/invite-member.usecase.js'
import { changeRoleUseCase } from '../application/change-role.usecase.js'
import { removeMemberUseCase } from '../application/remove-member.usecase.js'

export async function teamRoutes(app: FastifyInstance) {
  /**
   * GET /v1/team/members
   * List all active members in the organisation.
   */
  app.get('/members', {
    schema: { tags: ['Team'], summary: 'List organisation members', security: [{ cookieAuth: [] }] },
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const { organisationId } = req.user!
    const members = await listMembersUseCase(organisationId)
    return reply.send({ data: members })
  })

  /**
   * POST /v1/team/members
   * Invite / add a member to the organisation.
   */
  app.post('/members', {
    schema: { tags: ['Team'], summary: 'Invite a member', security: [{ cookieAuth: [] }] },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onRequest: app.csrfProtection as any,
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const body = z.object({
      email: z.string().email(),
      role:  z.enum(['admin', 'member']).optional(),
    }).parse(req.body)

    const { organisationId, role } = req.user!
    const member = await inviteMemberUseCase({
      organisationId,
      inviterRole: role,
      email: body.email,
      role: body.role,
    })

    return reply.status(201).send({ data: member })
  })

  /**
   * PATCH /v1/team/members/:userId/role
   * Change a member's role.
   */
  app.patch<{ Params: { userId: string } }>('/members/:userId/role', {
    schema: {
      params: z.object({ userId: z.string().uuid() }),
      tags: ['Team'],
      summary: 'Change member role',
      security: [{ cookieAuth: [] }],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onRequest: app.csrfProtection as any,
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const body = z.object({
      role: z.enum(['admin', 'member']),
    }).parse(req.body)

    const { userId, organisationId, role } = req.user!
    const result = await changeRoleUseCase({
      organisationId,
      requestorId: userId,
      requestorRole: role,
      targetUserId: req.params.userId,
      newRole: body.role,
    })

    return reply.send({ data: result })
  })

  /**
   * DELETE /v1/team/members/:userId
   * Remove a member from the organisation (soft-delete).
   */
  app.delete<{ Params: { userId: string } }>('/members/:userId', {
    schema: {
      params: z.object({ userId: z.string().uuid() }),
      tags: ['Team'],
      summary: 'Remove a member',
      security: [{ cookieAuth: [] }],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onRequest: app.csrfProtection as any,
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const { userId, organisationId, role } = req.user!
    await removeMemberUseCase({
      organisationId,
      requestorId: userId,
      requestorRole: role,
      targetUserId: req.params.userId,
    })

    return reply.status(204).send()
  })
}
