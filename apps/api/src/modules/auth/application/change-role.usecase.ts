import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { users } from '#schema'
import { ForbiddenError, NotFoundError } from '../../../shared/errors/app-errors.js'

export interface ChangeRoleInput {
  organisationId: string
  requestorId: string
  requestorRole: string
  targetUserId: string
  newRole: string
}

export async function changeRoleUseCase(input: ChangeRoleInput): Promise<{ id: string; role: string }> {
  const { organisationId, requestorId, requestorRole, targetUserId, newRole } = input

  // Only owner can change roles
  if (requestorRole !== 'owner') {
    throw new ForbiddenError('Only the owner can change member roles')
  }

  // Prevent changing own role
  if (requestorId === targetUserId) {
    throw new ForbiddenError('You cannot change your own role')
  }

  // Cannot set someone as owner (only one owner allowed)
  if (newRole === 'owner') {
    throw new ForbiddenError('Cannot assign the owner role to another user')
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

  // Update role
  const [updated] = await db
    .update(users)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(users.id, targetUserId))
    .returning({ id: users.id, role: users.role })

  if (!updated) throw new Error('Failed to update role')

  return updated
}
