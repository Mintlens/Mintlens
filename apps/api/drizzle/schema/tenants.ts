import { pgTable, uuid, text, timestamp, index, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { projects } from './projects.js'

export const tenants = pgTable(
  'tenants',
  {
    id:          uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    projectId:   uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    /** Opaque external identifier — maps to your CRM/Stripe customer ID */
    externalRef: text('external_ref').notNull(),
    name:        text('name'),
    /** JSON blob for custom metadata (sector, plan, etc.) */
    metadata:    text('metadata'),
    createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('tenants_project_ext_ref_unique').on(t.projectId, t.externalRef),
    index('tenants_project_id_idx').on(t.projectId),
  ],
)

export type Tenant = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert
