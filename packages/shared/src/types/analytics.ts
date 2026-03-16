/**
 * Analytics and reporting types for the dashboard.
 *
 * These types define the **contract** between the API and the frontend.
 * Both sides MUST agree on these shapes — keep them in sync with the
 * actual API responses (see apps/api/src/modules/analytics/domain/).
 */

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */

export interface CostDataPoint {
  date: string // ISO 8601 date (YYYY-MM-DD)
  costMicro: number
  tokens: number
  requests: number
}

export interface CostByDimension {
  key: string     // feature key, model name, provider name, etc.
  label: string   // human-readable label
  costMicro: number
  tokens: number
  requests: number
  /** Fraction of total cost in the period (0.0 – 1.0) */
  costPct: number
}

/* ------------------------------------------------------------------ */
/*  GET /v1/analytics/summary                                          */
/* ------------------------------------------------------------------ */

export interface AnalyticsSummary {
  totalCostMicro: number
  totalTokens: number
  totalRequests: number
  avgLatencyMs: number | null
  /** Period-over-period cost change as decimal (−0.12 = −12 %) */
  costChangePct: number | null
}

/* ------------------------------------------------------------------ */
/*  GET /v1/analytics/cost-explorer                                    */
/* ------------------------------------------------------------------ */

export interface CostExplorerResult {
  timeSeries: CostDataPoint[]
  byFeature: CostByDimension[]
  byModel: CostByDimension[]
  byProvider: CostByDimension[]
  totalCostMicro: number
  totalTokens: number
  totalRequests: number
}

/* ------------------------------------------------------------------ */
/*  GET /v1/analytics/tenants                                          */
/* ------------------------------------------------------------------ */

export interface TenantOverview {
  tenantId: string
  externalRef: string
  name: string | null
  costMicro: number
  revenueEstimatedMicro: number
  /** Gross margin as decimal (0.72 = 72 %). Null when revenue is 0. */
  grossMargin: number | null
  requests: number
  tokens: number
  lastSeenAt: string | null
}

/* ------------------------------------------------------------------ */
/*  Budgets                                                            */
/* ------------------------------------------------------------------ */

export interface BudgetStatus {
  budgetId: string
  name: string
  scope: 'project' | 'tenant' | 'feature'
  period: string
  limitMicro: number
  currentMicro: number
  usagePercent: number
  isBlocked: boolean
  alertsTriggered: number[]
}
