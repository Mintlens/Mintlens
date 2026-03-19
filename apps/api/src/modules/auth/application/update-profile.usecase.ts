import { eq } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { users } from '#schema'

interface UpdateProfileInput {
  firstName?: string | undefined
  lastName?: string | undefined
}

export async function updateProfileUseCase(
  userId: string,
  input: UpdateProfileInput,
): Promise<{ firstName: string | null; lastName: string | null }> {
  const [updated] = await db
    .update(users)
    .set({
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ firstName: users.firstName, lastName: users.lastName })

  return updated ?? { firstName: null, lastName: null }
}
