import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { organisations } from './organisations.js'

export const users = pgTable(
  'users',
  {
    id:             uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    organisationId: uuid('organisation_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
    email:          text('email').notNull().unique(),
    passwordHash:   text('password_hash').notNull(),
    role:           text('role').notNull().default('member'),
    firstName:      text('first_name'),
    lastName:       text('last_name'),
    emailVerified:  boolean('email_verified').notNull().default(false),
    createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt:      timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('users_org_id_idx').on(t.organisationId)],
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
