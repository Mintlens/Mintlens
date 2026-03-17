import { z } from 'zod'

/** Coerce ISO date string to Date, defaulting to last 30 days */
const dateParam = (defaultFn: () => Date) =>
  z.string().datetime({ offset: true }).optional().transform((v) =>
    v ? new Date(v) : defaultFn(),
  )

export const summaryQuery = z.object({
  from: dateParam(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d
  }),
  to: dateParam(() => new Date()),
})

export const costExplorerQuery = z.object({
  from: dateParam(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d
  }),
  to:          dateParam(() => new Date()),
  featureKey:  z.string().optional(),
  tenantId:    z.string().uuid().optional(),
  provider:    z.enum(['openai', 'anthropic', 'google', 'mistral', 'cohere', 'xai', 'other']).optional(),
  model:       z.string().optional(),
  environment: z.string().optional(),
  granularity: z.enum(['day', 'week', 'month']).default('day'),
})

export const tenantsOverviewQuery = z.object({
  from: dateParam(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d
  }),
  to:     dateParam(() => new Date()),
  limit:  z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
})

export const requestsQuery = z.object({
  from: dateParam(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d
  }),
  to:          dateParam(() => new Date()),
  limit:       z.coerce.number().int().min(1).max(200).default(50),
  offset:      z.coerce.number().int().min(0).default(0),
  provider:    z.string().optional(),
  model:       z.string().optional(),
  featureKey:  z.string().optional(),
  tenantId:    z.string().uuid().optional(),
  environment: z.string().optional(),
})

export type SummaryQuery         = z.infer<typeof summaryQuery>
export type CostExplorerQuery    = z.infer<typeof costExplorerQuery>
export type TenantsOverviewQuery = z.infer<typeof tenantsOverviewQuery>
export type RequestsQuery        = z.infer<typeof requestsQuery>
