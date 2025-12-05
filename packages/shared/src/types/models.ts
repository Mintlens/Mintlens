/**
 * Shared domain model types.
 * Used across API responses and SDK context.
 */

export type PlanTier = 'free' | 'pro' | 'team' | 'enterprise'

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'

export type BudgetPeriod = 'daily' | 'monthly' | 'rolling_30d'

export type BudgetScope = 'project' | 'tenant' | 'feature'

export type PricingPlanType = 'flat' | 'per_token' | 'per_call' | 'hybrid'

export interface Organisation {
  id: string
  name: string
  slug: string
  planTier: PlanTier
  createdAt: string
}

export interface Project {
  id: string
  organisationId: string
  name: string
  slug: string
  billingCurrency: string
  environment: string
  createdAt: string
}

export interface Feature {
  id: string
  projectId: string
  key: string
  name: string
  createdAt: string
}

export interface Tenant {
  id: string
  projectId: string
  externalRef: string
  name: string | null
  createdAt: string
}

export interface Budget {
  id: string
  projectId: string
  tenantId: string | null
  featureId: string | null
  name: string
  scope: BudgetScope
  limitMicro: number
  period: BudgetPeriod
  killSwitchEnabled: boolean
  alertThresholds: number[]
  isActive: boolean
  createdAt: string
}

export interface ApiKey {
  id: string
  projectId: string
  name: string
  keyPrefix: string
  scopes: string[]
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}
