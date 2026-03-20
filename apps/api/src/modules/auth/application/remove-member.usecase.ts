import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { users } from '#schema'
import { ForbiddenError, NotFoundError } from '../../../shared/errors/app-errors.js'

export interface RemoveMemberInput {
  organisationId: string
  requestorId: string
  requestorRole: string
  targetUserId: string
}

export async function removeMemberUseCase(input: RemoveMemberInput): Promise<void> {
  const { organisationId, requestorId, requestorRole, targetUserId } = input

  // Only owner or admin can remove members
  if (requestorRole !== 'owner' && requestorRole !== 'admin') {
    throw new ForbiddenError('Only owners and admins can remove members')
  }

  // Prevent removing yourself
  if (requestorId === targetUserId) {
    throw new ForbiddenError('You cannot remove yourself')
  }

  // Verify target exists in the same org
  const [target] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(and(
      eq(users.id, targetUserId),
      eq(users.organisationId, organisationId),
      isNull(users.deletedAt),
    ))
    .limit(1)

  if (!target) {
    throw new NotFoundError('Member', targetUserId)
  }

  // Prevent removing the owner
  if (target.role === 'owner') {
    throw new ForbiddenError('The organisation owner cannot be removed')
  }

  // Admins cannot remove other admins
  if (requestorRole === 'admin' && target.role === 'admin') {
    throw new ForbiddenError('Admins cannot remove other admins')
  }

  // Soft-delete
  await db
    .update(users)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, targetUserId))
}
