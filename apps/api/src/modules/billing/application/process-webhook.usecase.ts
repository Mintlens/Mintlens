import Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { organisations, subscriptions, invoices, stripeWebhookEvents } from '#schema'
import { logger } from '../../../shared/logger/logger.js'
import { invalidatePlanCache } from '../../../shared/middleware/require-plan.js'

/** Map Stripe price IDs to MintLens plan tiers */
function priceToPlan(priceId: string): string {
  const proMonthly = process.env['STRIPE_PRICE_PRO_MONTHLY']
  if (priceId === proMonthly) return 'pro'
  return 'pro' // default to pro for any paid subscription
}

export async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  // Idempotency check
  const [existing] = await db
    .select({ id: stripeWebhookEvents.id })
    .from(stripeWebhookEvents)
    .where(eq(stripeWebhookEvents.id, event.id))
    .limit(1)

  if (existing) {
    logger.info({ eventId: event.id }, 'Webhook event already processed, skipping')
    return
  }

  // Record event for idempotency
  await db.insert(stripeWebhookEvents).values({
    id: event.id,
    eventType: event.type,
  })

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      break

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
      break

    case 'invoice.payment_succeeded':
      await handleInvoicePaid(event.data.object as Stripe.Invoice)
      break

    case 'invoice.payment_failed':
      await handleInvoiceFailed(event.data.object as Stripe.Invoice)
      break

    default:
      logger.info({ eventType: event.type }, 'Unhandled webhook event type')
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orgId = session.client_reference_id ?? session.metadata?.mintlensOrgId
  if (!orgId || !session.subscription) return

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription.id

  // Fetch the full subscription from Stripe
  const stripe = (await import('../infrastructure/stripe.client.js')).getStripe()
  const sub = await stripe.subscriptions.retrieve(subscriptionId)

  const priceId = sub.items.data[0]?.price.id ?? ''
  const planTier = priceToPlan(priceId)

  // Update org plan tier
  await db
    .update(organisations)
    .set({
      planTier,
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
      updatedAt: new Date(),
    })
    .where(eq(organisations.id, orgId))

  // Upsert subscription record
  await db
    .insert(subscriptions)
    .values({
      organisationId: orgId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      status: sub.status,
      currentPeriodStart: new Date((sub as any).current_period_start * 1000),
      currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
    })
    .onConflictDoUpdate({
      target: subscriptions.organisationId,
      set: {
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        status: sub.status,
        currentPeriodStart: new Date((sub as any).current_period_start * 1000),
        currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
        updatedAt: new Date(),
      },
    })

  await invalidatePlanCache(orgId)
  logger.info({ orgId, planTier, subscriptionId }, 'Checkout completed, subscription activated')
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const [existing] = await db
    .select({ organisationId: subscriptions.organisationId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))
    .limit(1)

  if (!existing) return

  const priceId = sub.items.data[0]?.price.id ?? ''
  const planTier = priceToPlan(priceId)

  await db
    .update(subscriptions)
    .set({
      stripePriceId: priceId,
      status: sub.status,
      currentPeriodStart: new Date((sub as any).current_period_start * 1000),
      currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))

  await db
    .update(organisations)
    .set({ planTier, updatedAt: new Date() })
    .where(eq(organisations.id, existing.organisationId))

  await invalidatePlanCache(existing.organisationId)
  logger.info({ orgId: existing.organisationId, status: sub.status }, 'Subscription updated')
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const [existing] = await db
    .select({ organisationId: subscriptions.organisationId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))
    .limit(1)

  if (!existing) return

  await db
    .update(subscriptions)
    .set({ status: 'canceled', canceledAt: new Date(), updatedAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))

  // Downgrade to free
  await db
    .update(organisations)
    .set({ planTier: 'free', updatedAt: new Date() })
    .where(eq(organisations.id, existing.organisationId))

  await invalidatePlanCache(existing.organisationId)
  logger.info({ orgId: existing.organisationId }, 'Subscription deleted, downgraded to free')
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const [org] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.stripeCustomerId, customerId))
    .limit(1)

  if (!org) return

  await db
    .insert(invoices)
    .values({
      organisationId: org.id,
      stripeInvoiceId: invoice.id!,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      status: 'paid',
      invoiceUrl: invoice.hosted_invoice_url ?? null,
      invoicePdf: invoice.invoice_pdf ?? null,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
    })
    .onConflictDoNothing()

  // Clear past_due if it was set
  await db
    .update(subscriptions)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(subscriptions.organisationId, org.id))

  logger.info({ orgId: org.id, invoiceId: invoice.id }, 'Invoice paid')
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const [org] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.stripeCustomerId, customerId))
    .limit(1)

  if (!org) return

  await db
    .update(subscriptions)
    .set({ status: 'past_due', updatedAt: new Date() })
    .where(eq(subscriptions.organisationId, org.id))

  logger.warn({ orgId: org.id, invoiceId: invoice.id }, 'Invoice payment failed')
}
