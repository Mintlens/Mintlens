import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { projects } from './projects.js'
import { tenants } from './tenants.js'

export const pricingPlans = pgTable('pricing_plans', {
  id:                   uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId:            uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name:                 text('name').notNull(),
  type:                 text('type').notNull(),
  /** Unit price in microdollars */
  unitPriceMicro:       integer('unit_price_micro').notNull().default(0),
  /** Included token quota before overage billing */
  includedQuota:        integer('included_quota').notNull().default(0),
  /** Overage price in microdollars per token */
  overagePriceMicro:    integer('overage_price_micro').notNull().default(0),
  currency:             text('currency').notNull().default('USD'),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const tenantPricingPlans = pgTable('tenant_pricing_plans', {
  id:            uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  pricingPlanId: uuid('pricing_plan_id').notNull().references(() => pricingPlans.id),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
  effectiveTo:   timestamp('effective_to', { withTimezone: true }),
})

export type PricingPlan = typeof pricingPlans.$inferSelect
export type TenantPricingPlan = typeof tenantPricingPlans.$inferSelect
