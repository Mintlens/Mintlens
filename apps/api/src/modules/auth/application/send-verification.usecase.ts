import { randomBytes, createHash } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { users } from '#schema'
import { sendEmail } from '../../../shared/infrastructure/email.js'
import { redis } from '../../../shared/infrastructure/redis.js'

const VERIFICATION_TTL_HOURS = 24
const APP_URL = process.env['APP_URL'] ?? 'http://localhost:3000'

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export async function sendVerificationEmailUseCase(userId: string): Promise<void> {
  const [user] = await db
    .select({ id: users.id, email: users.email, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user || user.emailVerified) return

  const code = randomBytes(32).toString('hex')
  const codeHash = hashCode(code)

  // Store in Redis with TTL
  await redis.set(
    `email-verify:${codeHash}`,
    user.id,
    'EX',
    VERIFICATION_TTL_HOURS * 60 * 60,
  )

  const verifyUrl = `${APP_URL}/verify-email?code=${code}`

  await sendEmail({
    to: user.email,
    subject: '[Mintlens] Verify your email address',
    html: `
      <h2>Verify your email</h2>
      <p>Click the link below to verify your email address for Mintlens.</p>
      <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Verify email</a></p>
      <p>This link expires in ${VERIFICATION_TTL_HOURS} hours.</p>
    `,
  })
}

export async function verifyEmailUseCase(code: string): Promise<boolean> {
  const codeHash = hashCode(code)
  const userId = await redis.get(`email-verify:${codeHash}`)

  if (!userId) return false

  await db.update(users)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(users.id, userId))

  await redis.del(`email-verify:${codeHash}`)
  return true
}
