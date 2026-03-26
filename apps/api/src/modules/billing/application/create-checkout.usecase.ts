import { eq } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { organisations } from '#schema'
import { getStripe, STRIPE_PRICE_PRO_MONTHLY, APP_URL } from '../infrastructure/stripe.client.js'

export async function createCheckoutUseCase(
  organisationId: string,
): Promise<{ url: string }> {
  const stripe = getStripe()

  // Get or create Stripe Customer
  const [org] = await db
    .select({ id: organisations.id, name: organisations.name, stripeCustomerId: organisations.stripeCustomerId })
    .from(organisations)
    .where(eq(organisations.id, organisationId))
    .limit(1)

  if (!org) throw new Error('Organisation not found')

  let customerId = org.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { mintlensOrgId: organisationId },
    })
    customerId = customer.id

    await db
      .update(organisations)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(organisations.id, organisationId))
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: organisationId,
    mode: 'subscription',
    line_items: [{ price: STRIPE_PRICE_PRO_MONTHLY, quantity: 1 }],
    success_url: `${APP_URL}/settings?tab=subscription&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/settings?tab=subscription&canceled=true`,
    metadata: { mintlensOrgId: organisationId },
  })

  if (!session.url) throw new Error('Failed to create checkout session')

  return { url: session.url }
}
