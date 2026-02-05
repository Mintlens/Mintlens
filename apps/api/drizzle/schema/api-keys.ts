import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { projects } from './projects.js'

export const apiKeys = pgTable(
  'api_keys',
  {
    id:          uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    projectId:   uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    name:        text('name').notNull(),
    /** SHA-256(rawKey + salt) — never store raw key */
    keyHash:     text('key_hash').notNull().unique(),
    /** First 16 chars of the prefixed key — shown in UI for identification */
    keyPrefix:   text('key_prefix').notNull(),
    scopes:      text('scopes').array().notNull().default(['ingest']),
    lastUsedAt:  timestamp('last_used_at', { withTimezone: true }),
    expiresAt:   timestamp('expires_at', { withTimezone: true }),
    createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt:   timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => [index('api_keys_project_id_idx').on(t.projectId)],
)

export type ApiKey = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert
