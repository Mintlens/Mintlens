import { eq } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { organisations, subscriptions } from '#schema'
import { redis } from '../../../shared/infrastructure/redis.js'
import { getPlanLimits } from '../domain/plan-limits.js'

export interface SubscriptionInfo {
  plan: string
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  usage: { requests: number }
  limits: { requests: number }
  hasStripeCustomer: boolean
}

export async function getSubscriptionUseCase(
  organisationId: string,
): Promise<SubscriptionInfo> {
  const [org] = await db
    .select({
      planTier: organisations.planTier,
      stripeCustomerId: organisations.stripeCustomerId,
    })
    .from(organisations)
    .where(eq(organisations.id, organisationId))
    .limit(1)

  const planTier = org?.planTier ?? 'free'
  const limits = getPlanLimits(planTier)

  // Get current subscription details if exists
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organisationId, organisationId))
    .limit(1)

  // Get current month's usage from Redis
  const month = new Date().toISOString().slice(0, 7)
  const usageRaw = await redis.get(`usage:org:${organisationId}:monthly:${month}`)
  const requestCount = usageRaw ? Number(usageRaw) : 0

  return {
    plan: planTier,
    status: sub?.status ?? 'free',
    currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    usage: { requests: requestCount },
    limits: { requests: limits.requestsPerMonth },
    hasStripeCustomer: !!org?.stripeCustomerId,
  }
}
