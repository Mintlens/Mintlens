import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const organisations = pgTable('organisations', {
  id:        uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name:      text('name').notNull(),
  slug:      text('slug').notNull().unique(),
  planTier:  text('plan_tier').notNull().default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export type Organisation = typeof organisations.$inferSelect
export type NewOrganisation = typeof organisations.$inferInsert
