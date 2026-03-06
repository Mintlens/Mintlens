export type BudgetScope = 'project' | 'tenant' | 'feature'
export type BudgetPeriod = 'daily' | 'monthly' | 'rolling_30d'

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
  createdAt: Date
  updatedAt: Date
}

export interface BudgetUsage {
  budgetId: string
  name: string
  scope: BudgetScope
  period: BudgetPeriod
  limitMicro: number
  spentMicro: number
  usagePct: number
  killSwitchEnabled: boolean
  isActive: boolean
}

export interface CreateBudgetInput {
  projectId: string
  name: string
  scope: BudgetScope
  limitMicro: number
  period: BudgetPeriod
  killSwitchEnabled?: boolean
  alertThresholds?: number[]
  tenantId?: string
  featureId?: string
}
