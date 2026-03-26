import { redis } from '../../../shared/infrastructure/redis.js'
import { getOrgPlanTier } from '../../../shared/middleware/require-plan.js'
import { getPlanLimits } from '../domain/plan-limits.js'

export interface UsageInfo {
  period: string
  requests: number
  limit: number
  percentUsed: number
  plan: string
}

export async function getUsageUseCase(organisationId: string): Promise<UsageInfo> {
  const month = new Date().toISOString().slice(0, 7)
  const usageKey = `usage:org:${organisationId}:monthly:${month}`
  const raw = await redis.get(usageKey)
  const requests = raw ? Number(raw) : 0

  const plan = await getOrgPlanTier(organisationId)
  const limits = getPlanLimits(plan)
  const limit = limits.requestsPerMonth
  const percentUsed = limit > 0 ? Math.round((requests / limit) * 100) : 0

  return { period: month, requests, limit, percentUsed, plan }
}
