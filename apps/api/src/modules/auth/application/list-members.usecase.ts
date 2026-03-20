import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { users } from '#schema'

export interface MemberRow {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  createdAt: Date
}

export async function listMembersUseCase(organisationId: string): Promise<MemberRow[]> {
  const rows = await db
    .select({
      id:        users.id,
      email:     users.email,
      firstName: users.firstName,
      lastName:  users.lastName,
      role:      users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.organisationId, organisationId), isNull(users.deletedAt)))
    .orderBy(users.createdAt)

  return rows
}
