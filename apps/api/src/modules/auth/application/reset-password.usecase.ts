import { createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { eq, and, isNull, gt } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { users, passwordResetTokens } from '#schema'
import { ValidationError } from '../../../shared/errors/app-errors.js'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function resetPasswordUseCase(
  token: string,
  newPassword: string,
): Promise<void> {
  if (newPassword.length < 8) {
    throw new ValidationError('Password must be at least 8 characters')
  }

  const tokenHash = hashToken(token)

  const [record] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt,
    })
    .from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, new Date()),
    ))
    .limit(1)

  if (!record) {
    throw new ValidationError('Reset link is invalid or has expired')
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)

  await db.update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, record.userId))

  await db.update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, record.id))
}
