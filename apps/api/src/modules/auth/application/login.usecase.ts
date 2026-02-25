import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { users } from '../../../drizzle/schema/index.js'
import { AuthError } from '../../../shared/errors/app-errors.js'
import type { LoginInput, AuthTokens } from '../domain/auth.types.js'
import { issueTokens } from './auth.helpers.js'

export async function loginUseCase(input: LoginInput): Promise<AuthTokens> {
  const email = input.email.toLowerCase().trim()

  const [user] = await db
    .select({
      id: users.id,
      organisationId: users.organisationId,
      role: users.role,
      passwordHash: users.passwordHash,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  // Constant-time: always compare even if not found (prevents timing attacks)
  const dummyHash = '$2a$12$invalidHashForTimingConstancy...........'
  const hashToCompare = user?.passwordHash ?? dummyHash

  const valid = await bcrypt.compare(input.password, hashToCompare)

  if (!user || !valid || user.deletedAt) {
    throw new AuthError('Invalid email or password')
  }

  return issueTokens(user.id, user.organisationId, user.role)
}
