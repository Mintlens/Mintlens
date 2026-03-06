import { z } from 'zod'

export const createBudgetBody = z.object({
  projectId:         z.string().uuid(),
  name:              z.string().min(1).max(120),
  scope:             z.enum(['project', 'tenant', 'feature']),
  /** Budget ceiling in microdollars (1 USD = 1_000_000 µ$) */
  limitMicro:        z.number().int().positive(),
  period:            z.enum(['daily', 'monthly', 'rolling_30d']),
  killSwitchEnabled: z.boolean().optional(),
  alertThresholds:   z.array(z.number().int().min(1).max(100)).min(1).max(5).optional(),
  /** UUID of tenant to scope this budget to (scope = 'tenant') */
  tenantId:          z.string().uuid().optional(),
  /** UUID of feature to scope this budget to (scope = 'feature') */
  featureId:         z.string().uuid().optional(),
})

export const listBudgetsQuery = z.object({
  projectId: z.string().uuid(),
})

export type CreateBudgetBody    = z.infer<typeof createBudgetBody>
export type ListBudgetsQuery    = z.infer<typeof listBudgetsQuery>
