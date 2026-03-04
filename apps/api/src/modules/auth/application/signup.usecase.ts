import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { organisations, users } from '#schema'
import { ConflictError, ValidationError } from '../../../shared/errors/app-errors.js'
import type { SignupInput, AuthTokens } from '../domain/auth.types.js'
import { issueTokens, slugify } from './auth.helpers.js'

const SALT_ROUNDS = 12

export async function signupUseCase(input: SignupInput): Promise<AuthTokens> {
  const email = input.email.toLowerCase().trim()

  // Check for duplicate email
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing.length > 0) {
    throw new ConflictError('An account with this email already exists')
  }

  if (input.password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters', 'password')
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)

  // Transactionally create org + user
  const result = await db.transaction(async (tx) => {
    const slug = slugify(input.organisationName)

    const [org] = await tx
      .insert(organisations)
      .values({
        name: input.organisationName,
        slug: `${slug}-${crypto.randomUUID().slice(0, 8)}`,
        planTier: 'free',
      })
      .returning({ id: organisations.id })

    if (!org) throw new Error('Failed to create organisation')

    const [user] = await tx
      .insert(users)
      .values({
        organisationId: org.id,
        email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: 'owner',
      })
      .returning({ id: users.id, organisationId: users.organisationId, role: users.role })

    if (!user) throw new Error('Failed to create user')

    return user
  })

  return issueTokens(result.id, result.organisationId, result.role)
}
