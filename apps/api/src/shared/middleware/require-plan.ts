import type { FastifyRequest, FastifyReply } from 'fastify'
import { eq } from 'drizzle-orm'
import { db } from '../infrastructure/db.js'
import { organisations } from '#schema'
import { redis } from '../infrastructure/redis.js'
import { PlanUpgradeRequiredError } from '../errors/app-errors.js'
import type { PlanTier } from '../../modules/billing/domain/plan-limits.js'

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, enterprise: 2 }
const CACHE_TTL = 300 // 5 minutes

/**
 * Middleware that checks the organisation's plan tier.
 * Returns 402 if the org's plan is below the minimum required.
 */
export function requirePlan(minTier: PlanTier) {
  const minRank = PLAN_RANK[minTier] ?? 0

  return async (req: FastifyRequest, _reply: FastifyReply) => {
    const orgId = req.user?.organisationId
    if (!orgId) return // requireAuth should have caught this

    const planTier = await getOrgPlanTier(orgId)
    const currentRank = PLAN_RANK[planTier] ?? 0

    if (currentRank < minRank) {
      throw new PlanUpgradeRequiredError(planTier, minTier)
    }
  }
}

/** Get org plan tier with Redis cache */
export async function getOrgPlanTier(orgId: string): Promise<string> {
  const cacheKey = `plan:org:${orgId}`
  const cached = await redis.get(cacheKey)
  if (cached) return cached

  const [org] = await db
    .select({ planTier: organisations.planTier })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1)

  const tier = org?.planTier ?? 'free'
  await redis.set(cacheKey, tier, 'EX', CACHE_TTL)
  return tier
}

/** Invalidate cached plan tier (call after webhook updates planTier) */
export async function invalidatePlanCache(orgId: string): Promise<void> {
  await redis.del(`plan:org:${orgId}`)
}
