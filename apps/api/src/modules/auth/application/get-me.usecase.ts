import { eq } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { users, organisations } from '#schema'
import { NotFoundError } from '../../../shared/errors/app-errors.js'

export interface MeResult {
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    role: string
  }
  organisation: {
    id: string
    name: string
    slug: string
    planTier: string
  }
}

export async function getMeUseCase(userId: string): Promise<MeResult> {
  const [row] = await db
    .select({
      userId: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      orgId: organisations.id,
      orgName: organisations.name,
      orgSlug: organisations.slug,
      planTier: organisations.planTier,
    })
    .from(users)
    .innerJoin(organisations, eq(users.organisationId, organisations.id))
    .where(eq(users.id, userId))
    .limit(1)

  if (!row) throw new NotFoundError('User', userId)

  return {
    user: {
      id: row.userId,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role,
    },
    organisation: {
      id: row.orgId,
      name: row.orgName,
      slug: row.orgSlug,
      planTier: row.planTier,
    },
  }
}
