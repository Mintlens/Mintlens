import { pgTable, uuid, text, integer, timestamp, index, pgEnum } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { projects } from './projects.js'
import { tenants } from './tenants.js'
import { features } from './features.js'

export const llmProviderEnum = pgEnum('llm_provider', [
  'openai',
  'anthropic',
  'google',
  'mistral',
  'cohere',
  'other',
])

/**
 * Core telemetry table — write-heavy, optimized for analytical reads.
 *
 * Cost storage convention: all monetary values in microdollars (µ$)
 * 1 USD = 1,000,000 µ$ — integer arithmetic, never floats.
 *
 * Privacy guarantee: no prompt or response content is ever stored here.
 */
export const llmRequests = pgTable(
  'llm_requests',
  {
    id:          uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    projectId:   uuid('project_id').notNull().references(() => projects.id),
    tenantId:    uuid('tenant_id').references(() => tenants.id),
    /** Opaque end-user identifier — never PII */
    userId:      text('user_id'),
    featureId:   uuid('feature_id').references(() => features.id),

    provider:    llmProviderEnum('provider').notNull(),
    model:       text('model').notNull(),
    /** Provider-issued request/completion ID for deduplication */
    requestRef:  text('request_ref'),

    tokensInput:  integer('tokens_input').notNull().default(0),
    tokensOutput: integer('tokens_output').notNull().default(0),
    tokensTotal:  integer('tokens_total').notNull().default(0),

    /** Actual provider cost in microdollars */
    costProviderMicro:     integer('cost_provider_micro').notNull().default(0),
    /** Total cost (with markup) in microdollars */
    costTotalMicro:        integer('cost_total_micro').notNull().default(0),
    /** Estimated revenue based on tenant pricing plan */
    revenueEstimatedMicro: integer('revenue_estimated_micro').default(0),

    latencyMs:   integer('latency_ms'),
    environment: text('environment').notNull().default('production'),
    sdkVersion:  text('sdk_version'),
    tags:        text('tags').array(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Primary analytical index: all queries filter by project + time range
    index('llm_req_project_created_at_idx').on(t.projectId, t.createdAt),
    index('llm_req_tenant_created_at_idx').on(t.tenantId, t.createdAt),
    index('llm_req_feature_created_at_idx').on(t.featureId, t.createdAt),
    index('llm_req_provider_model_idx').on(t.provider, t.model),
  ],
)

export type LlmRequest = typeof llmRequests.$inferSelect
export type NewLlmRequest = typeof llmRequests.$inferInsert
