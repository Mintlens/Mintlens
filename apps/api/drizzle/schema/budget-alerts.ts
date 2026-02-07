import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { budgets } from './budgets.js'

export const budgetAlerts = pgTable(
  'budget_alerts',
  {
    id:         uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    budgetId:   uuid('budget_id').notNull().references(() => budgets.id, { onDelete: 'cascade' }),
    threshold:  integer('threshold').notNull(),
    /** 'email' | 'slack' */
    channel:    text('channel').notNull(),
    /** Email address or Slack webhook URL */
    recipient:  text('recipient').notNull(),
    firedAt:    timestamp('fired_at', { withTimezone: true }),
    /** Period key to prevent duplicate alerts, e.g. "2026-03" for monthly */
    period:     text('period').notNull(),
    createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('budget_alerts_budget_id_idx').on(t.budgetId)],
)

export type BudgetAlert = typeof budgetAlerts.$inferSelect
export type NewBudgetAlert = typeof budgetAlerts.$inferInsert
