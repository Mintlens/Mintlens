import bcrypt from 'bcryptjs'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { users } from '#schema'
import { ConflictError, ForbiddenError } from '../../../shared/errors/app-errors.js'

const SALT_ROUNDS = 12

export interface InviteMemberInput {
  organisationId: string
  inviterRole: string
  email: string
  role?: string | undefined
}

export interface InvitedMember {
  id: string
  email: string
  role: string
  firstName: string | null
  lastName: string | null
  createdAt: Date
}

export async function inviteMemberUseCase(input: InviteMemberInput): Promise<InvitedMember> {
  const { organisationId, inviterRole, role = 'member' } = input
  const email = input.email.toLowerCase().trim()

  // Only owner or admin can invite
  if (inviterRole !== 'owner' && inviterRole !== 'admin') {
    throw new ForbiddenError('Only owners and admins can invite members')
  }

  // Admins cannot invite other admins or owners
  if (inviterRole === 'admin' && role !== 'member') {
    throw new ForbiddenError('Admins can only invite members')
  }

  // Cannot invite as owner
  if (role === 'owner') {
    throw new ForbiddenError('Cannot invite a user as owner')
  }

  // Check if email already exists in the org (including soft-deleted)
  const existing = await db
    .select({ id: users.id, deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing.length > 0) {
    throw new ConflictError('A user with this email already exists')
  }

  // MVP: create user directly with a random temporary password
  const tempPassword = crypto.randomUUID()
  const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS)

  const [created] = await db
    .insert(users)
    .values({
      organisationId,
      email,
      passwordHash,
      role,
    })
    .returning({
      id:        users.id,
      email:     users.email,
      role:      users.role,
      firstName: users.firstName,
      lastName:  users.lastName,
      createdAt: users.createdAt,
    })

  if (!created) throw new Error('Failed to create user')

  return created
}
