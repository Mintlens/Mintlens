import { randomBytes, createHash } from 'node:crypto'
import { eq, isNull } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { users, passwordResetTokens } from '#schema'
import { sendEmail } from '../../../shared/infrastructure/email.js'

const TOKEN_TTL_MINUTES = 30
const APP_URL = process.env['APP_URL'] ?? 'http://localhost:3000'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function forgotPasswordUseCase(email: string): Promise<void> {
  // Always return success to prevent email enumeration
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1)

  if (!user) return

  // Generate a secure random token
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000)

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  })

  const resetUrl = `${APP_URL}/reset-password?token=${rawToken}`

  await sendEmail({
    to: user.email,
    subject: '[Mintlens] Reset your password',
    html: `
      <h2>Password reset</h2>
      <p>You requested a password reset for your Mintlens account.</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Reset password</a></p>
      <p>This link expires in ${TOKEN_TTL_MINUTES} minutes.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  })
}
