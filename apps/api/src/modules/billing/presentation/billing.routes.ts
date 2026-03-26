import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../../../shared/middleware/require-auth.js'
import { createCheckoutUseCase } from '../application/create-checkout.usecase.js'
import { createPortalUseCase } from '../application/create-portal.usecase.js'
import { getSubscriptionUseCase } from '../application/get-subscription.usecase.js'
import { cancelSubscriptionUseCase, resumeSubscriptionUseCase } from '../application/cancel-subscription.usecase.js'
import { processWebhookEvent } from '../application/process-webhook.usecase.js'
import { getStripe, STRIPE_WEBHOOK_SECRET } from '../infrastructure/stripe.client.js'
import { db } from '../../../shared/infrastructure/db.js'
import { invoices } from '#schema'
import { eq, desc } from 'drizzle-orm'
import { logger } from '../../../shared/logger/logger.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export async function billingRoutes(app: FastifyInstance) {
  // CSRF on mutating methods (except webhook which uses Stripe signature)
  app.addHook('onRequest', async (req, reply) => {
    if (SAFE_METHODS.has(req.method)) return
    if (req.url.includes('/webhooks/stripe')) return // webhook uses its own auth
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await new Promise<void>((resolve, reject) => {
      (app.csrfProtection as any)(req, reply, (err: Error | undefined) => {
        err ? reject(err) : resolve()
      })
    })
  })

  /**
   * POST /v1/billing/checkout
   * Creates a Stripe Checkout Session for Pro plan. Returns redirect URL.
   */
  app.post('/checkout', {
    schema: { tags: ['Billing'], summary: 'Create Stripe Checkout Session', security: [{ cookieAuth: [] }] },
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const { organisationId, role } = req.user!
    if (role !== 'owner') {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only the org owner can manage billing' } })
    }
    const result = await createCheckoutUseCase(organisationId)
    return reply.send({ data: result })
  })

  /**
   * POST /v1/billing/portal
   * Creates a Stripe Customer Portal session. Returns redirect URL.
   */
  app.post('/portal', {
    schema: { tags: ['Billing'], summary: 'Create Stripe billing portal session', security: [{ cookieAuth: [] }] },
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const { organisationId, role } = req.user!
    if (role !== 'owner') {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only the org owner can manage billing' } })
    }
    const result = await createPortalUseCase(organisationId)
    return reply.send({ data: result })
  })

  /**
   * GET /v1/billing/subscription
   * Returns current plan, status, usage, and limits.
   */
  app.get('/subscription', {
    schema: { tags: ['Billing'], summary: 'Get current subscription', security: [{ cookieAuth: [] }] },
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const { organisationId } = req.user!
    const result = await getSubscriptionUseCase(organisationId)
    return reply.send({ data: result })
  })

  /**
   * POST /v1/billing/cancel
   * Cancels subscription at the end of the current billing period.
   */
  app.post('/cancel', {
    schema: { tags: ['Billing'], summary: 'Cancel subscription at period end', security: [{ cookieAuth: [] }] },
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const { organisationId, role } = req.user!
    if (role !== 'owner') {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only the org owner can cancel' } })
    }
    await cancelSubscriptionUseCase(organisationId)
    return reply.send({ data: { message: 'Subscription will be canceled at the end of the current period.' } })
  })

  /**
   * POST /v1/billing/resume
   * Reactivates a subscription that was scheduled for cancellation.
   */
  app.post('/resume', {
    schema: { tags: ['Billing'], summary: 'Reactivate canceled subscription', security: [{ cookieAuth: [] }] },
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const { organisationId, role } = req.user!
    if (role !== 'owner') {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only the org owner can manage billing' } })
    }
    await resumeSubscriptionUseCase(organisationId)
    return reply.send({ data: { message: 'Subscription reactivated.' } })
  })

  /**
   * GET /v1/billing/invoices
   * Returns recent invoices for the organisation.
   */
  app.get('/invoices', {
    schema: { tags: ['Billing'], summary: 'List invoices', security: [{ cookieAuth: [] }] },
    preHandler: [requireAuth],
  }, async (req, reply) => {
    const { organisationId } = req.user!
    const q = z.object({
      limit: z.coerce.number().int().min(1).max(50).default(10),
    }).parse(req.query)

    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.organisationId, organisationId))
      .orderBy(desc(invoices.createdAt))
      .limit(q.limit)

    return reply.send({
      data: rows.map((r) => ({
        id: r.id,
        stripeInvoiceId: r.stripeInvoiceId,
        amountPaid: r.amountPaid,
        currency: r.currency,
        status: r.status,
        invoiceUrl: r.invoiceUrl,
        invoicePdf: r.invoicePdf,
        periodStart: r.periodStart.toISOString(),
        periodEnd: r.periodEnd.toISOString(),
        createdAt: r.createdAt.toISOString(),
      })),
    })
  })

  /**
   * POST /v1/billing/webhooks/stripe
   * Stripe webhook receiver. No cookie auth — verified via Stripe signature.
   */
  app.post('/webhooks/stripe', {
    schema: { tags: ['Billing'], summary: 'Stripe webhook endpoint' },
    config: {
      rawBody: true,
      rateLimit: { max: 100, timeWindow: '1 minute' },
    },
  }, async (req, reply) => {
    const sig = req.headers['stripe-signature']
    if (!sig || !STRIPE_WEBHOOK_SECRET) {
      return reply.status(400).send({ error: 'Missing signature or webhook secret' })
    }

    let event
    try {
      const stripe = getStripe()
      // Fastify parses JSON by default; use rawBody if available, otherwise re-stringify
      const body = (req as any).rawBody ?? JSON.stringify(req.body)
      event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      logger.warn({ err }, 'Webhook signature verification failed')
      return reply.status(400).send({ error: 'Invalid signature' })
    }

    try {
      await processWebhookEvent(event)
    } catch (err) {
      logger.error({ err, eventId: event.id, eventType: event.type }, 'Webhook processing failed')
      // Return 200 to prevent Stripe from retrying on application errors
      // The error is logged for investigation
    }

    return reply.status(200).send({ received: true })
  })
}
