import { pgTable, uuid, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { projects } from './projects.js'
import { tenants } from './tenants.js'
import { features } from './features.js'

export const budgets = pgTable(
  'budgets',
  {
    id:         uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    projectId:  uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    tenantId:   uuid('tenant_id').references(() => tenants.id),
    featureId:  uuid('feature_id').references(() => features.id),
    name:       text('name').notNull(),

    /** Scope determines which dimension this budget applies to */
    scope:      text('scope').notNull(),

    /** Budget ceiling in microdollars */
    limitMicro: integer('limit_micro').notNull(),

    /** 'daily' | 'monthly' | 'rolling_30d' */
    period:     text('period').notNull(),

    /** When true: API calls are blocked after 100% threshold */
    killSwitchEnabled: boolean('kill_switch_enabled').notNull().default(false),

    /** Percentage thresholds that trigger alerts, e.g. [80, 100] */
    alertThresholds: integer('alert_thresholds').array().notNull().default([80, 100]),

    isActive:  boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('budgets_project_id_idx').on(t.projectId)],
)

export type Budget = typeof budgets.$inferSelect
export type NewBudget = typeof budgets.$inferInsert
