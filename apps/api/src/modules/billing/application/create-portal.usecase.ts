import { eq } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { organisations } from '#schema'
import { getStripe, APP_URL } from '../infrastructure/stripe.client.js'

export async function createPortalUseCase(
  organisationId: string,
): Promise<{ url: string }> {
  const [org] = await db
    .select({ stripeCustomerId: organisations.stripeCustomerId })
    .from(organisations)
    .where(eq(organisations.id, organisationId))
    .limit(1)

  if (!org?.stripeCustomerId) {
    throw new Error('No billing account found. Upgrade to Pro first.')
  }

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${APP_URL}/settings?tab=subscription`,
  })

  return { url: session.url }
}
