import { eq } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { subscriptions } from '#schema'
import { getStripe } from '../infrastructure/stripe.client.js'
import { NotFoundError } from '../../../shared/errors/app-errors.js'

export async function cancelSubscriptionUseCase(
  organisationId: string,
): Promise<void> {
  const [sub] = await db
    .select({ stripeSubscriptionId: subscriptions.stripeSubscriptionId })
    .from(subscriptions)
    .where(eq(subscriptions.organisationId, organisationId))
    .limit(1)

  if (!sub) throw new NotFoundError('Subscription', organisationId)

  const stripe = getStripe()
  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  })

  await db
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
    .where(eq(subscriptions.organisationId, organisationId))
}

export async function resumeSubscriptionUseCase(
  organisationId: string,
): Promise<void> {
  const [sub] = await db
    .select({ stripeSubscriptionId: subscriptions.stripeSubscriptionId })
    .from(subscriptions)
    .where(eq(subscriptions.organisationId, organisationId))
    .limit(1)

  if (!sub) throw new NotFoundError('Subscription', organisationId)

  const stripe = getStripe()
  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: false,
  })

  await db
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: false, canceledAt: null, updatedAt: new Date() })
    .where(eq(subscriptions.organisationId, organisationId))
}
