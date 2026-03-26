export type PlanTier = 'free' | 'pro' | 'enterprise'

export interface PlanLimits {
  requestsPerMonth: number
  maxProjects: number
  maxBudgets: number
  maxTeamMembers: number
  retentionDays: number
  csvExport: boolean
  killSwitch: boolean
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    requestsPerMonth: 10_000,
    maxProjects: 1,
    maxBudgets: 2,
    maxTeamMembers: 3,
    retentionDays: 7,
    csvExport: false,
    killSwitch: false,
  },
  pro: {
    requestsPerMonth: 100_000,
    maxProjects: 5,
    maxBudgets: -1, // unlimited
    maxTeamMembers: 10,
    retentionDays: 90,
    csvExport: true,
    killSwitch: true,
  },
  enterprise: {
    requestsPerMonth: -1, // unlimited
    maxProjects: -1,
    maxBudgets: -1,
    maxTeamMembers: -1,
    retentionDays: 365,
    csvExport: true,
    killSwitch: true,
  },
}

export function getPlanLimits(tier: string): PlanLimits {
  return PLAN_LIMITS[tier as PlanTier] ?? PLAN_LIMITS.free
}
