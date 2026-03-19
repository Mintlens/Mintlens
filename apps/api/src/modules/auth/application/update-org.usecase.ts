import { eq } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { organisations } from '#schema'
import { ForbiddenError } from '../../../shared/errors/app-errors.js'

export async function updateOrgUseCase(
  organisationId: string,
  role: string,
  input: { name: string },
): Promise<{ name: string }> {
  if (role !== 'owner') {
    throw new ForbiddenError('Only the organisation owner can update settings')
  }

  const [updated] = await db
    .update(organisations)
    .set({ name: input.name, updatedAt: new Date() })
    .where(eq(organisations.id, organisationId))
    .returning({ name: organisations.name })

  return updated ?? { name: input.name }
}
