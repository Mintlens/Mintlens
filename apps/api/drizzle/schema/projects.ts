import { pgTable, uuid, text, timestamp, index, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { organisations } from './organisations.js'

export const projects = pgTable(
  'projects',
  {
    id:              uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    organisationId:  uuid('organisation_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
    name:            text('name').notNull(),
    slug:            text('slug').notNull(),
    billingCurrency: text('billing_currency').notNull().default('USD'),
    environment:     text('environment').notNull().default('production'),
    createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt:       timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    unique('projects_org_slug_unique').on(t.organisationId, t.slug),
    index('projects_org_id_idx').on(t.organisationId),
  ],
)

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
