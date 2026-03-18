/** Analytics domain types — no framework dependencies. */

export interface DateRange {
  from: Date
  to: Date
}

export interface AnalyticsSummary {
  totalCostMicro:    number
  totalTokens:       number
  totalRequests:     number
  avgLatencyMs:      number | null
  /** Period-over-period cost change as a decimal (-0.12 = -12%) */
  costChangePct:     number | null
}

export interface CostDataPoint {
  date:          string   // ISO date YYYY-MM-DD
  costMicro:     number
  tokens:        number
  requests:      number
}

export interface CostByDimension {
  key:           string   // model name, feature key, or tenant externalRef
  label:         string
  costMicro:     number
  tokens:        number
  requests:      number
  costPct:       number   // % of total cost in this period
}

export interface CostExplorerResult {
  timeSeries:    CostDataPoint[]
  byModel:       CostByDimension[]
  byFeature:     CostByDimension[]
  byProvider:    CostByDimension[]
  totalCostMicro: number
  totalTokens:   number
  totalRequests: number
}

export interface TenantOverview {
  tenantId:               string
  externalRef:            string
  name:                   string | null
  costMicro:              number
  revenueEstimatedMicro:  number
  /** Gross margin as decimal (0.72 = 72%). Null if revenue is 0. */
  grossMargin:            number | null
  requests:               number
  tokens:                 number
  lastSeenAt:             string | null
}

export interface CostExplorerFilters {
  projectId:      string
  organisationId: string
  from:           Date
  to:             Date
  featureKey?:    string
  tenantId?:      string
  provider?:      string
  model?:         string
  environment?:   string
  granularity:    'day' | 'week' | 'month'
}
