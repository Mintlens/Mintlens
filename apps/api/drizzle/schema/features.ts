import { pgTable, uuid, text, timestamp, index, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { projects } from './projects.js'

export const features = pgTable(
  'features',
  {
    id:        uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    /** Machine-readable key used in SDK calls (e.g. "support_chat", "code_assistant") */
    key:       text('key').notNull(),
    name:      text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('features_project_key_unique').on(t.projectId, t.key),
    index('features_project_id_idx').on(t.projectId),
  ],
)

export type Feature = typeof features.$inferSelect
export type NewFeature = typeof features.$inferInsert
