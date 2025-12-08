/**
 * Analytics and reporting types for the dashboard.
 */

export interface CostDataPoint {
  date: string // ISO 8601 date (YYYY-MM-DD)
  costMicro: number
  requestCount: number
  tokensInput: number
  tokensOutput: number
}

export interface CostByDimension {
  key: string     // feature key, model name, provider name, etc.
  label: string   // human-readable label
  costMicro: number
  requestCount: number
  percentage: number
}

export interface DashboardSummary {
  /** Current calendar month */
  currentMonth: {
    costMicro: number
    requestCount: number
    tokensTotal: number
    avgCostPerRequestMicro: number
  }
  /** Previous calendar month for comparison */
  previousMonth: {
    costMicro: number
    requestCount: number
  }
  /** Percentage change month-over-month */
  momCostChange: number
  /** Top 5 most expensive features */
  topFeatures: CostByDimension[]
  /** Top 5 most used models */
  topModels: CostByDimension[]
}

export interface CostExplorerResult {
  timeSeries: CostDataPoint[]
  byFeature: CostByDimension[]
  byModel: CostByDimension[]
  byProvider: CostByDimension[]
  totals: {
    costMicro: number
    requestCount: number
    tokensInput: number
    tokensOutput: number
  }
}

export interface TenantOverview {
  tenantId: string
  tenantName: string | null
  externalRef: string
  period: string // "2026-03"
  costMicro: number
  requestCount: number
  tokensTotal: number
  /** If a pricing plan is configured */
  revenueEstimatedMicro?: number
  marginMicro?: number
  marginPercent?: number
  topFeatures: CostByDimension[]
}

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
