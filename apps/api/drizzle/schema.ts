/**
 * Drizzle ORM schema — all tables in a single file.
 *
 * This avoids cross-file imports with .js extensions which drizzle-kit
 * cannot resolve in ESM + NodeNext projects.
 * See: https://github.com/drizzle-team/drizzle-orm/issues/1625
 *
 * Tables are ordered by dependency: parents first, children second.
 */

import {
    pgTable,
    pgEnum,
    uuid,
    text,
    integer,
    boolean,
    timestamp,
    index,
    unique,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ────────────────────────────────────────────────────────────────
// Enums
// ────────────────────────────────────────────────────────────────

export const llmProviderEnum = pgEnum('llm_provider', [
    'openai',
    'anthropic',
    'google',
    'mistral',
    'cohere',
    'xai',
    'groq',
    'together_ai',
    'deepseek',
    'perplexity',
    'kimi',
    'bedrock',
    'ollama',
    'other',
])

// ────────────────────────────────────────────────────────────────
// Organisations
// ────────────────────────────────────────────────────────────────

export const organisations = pgTable('organisations', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    planTier: text('plan_tier').notNull().default('free'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export type Organisation = typeof organisations.$inferSelect
export type NewOrganisation = typeof organisations.$inferInsert

// ────────────────────────────────────────────────────────────────
// Users
// ────────────────────────────────────────────────────────────────

export const users = pgTable(
    'users',
    {
        id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
        organisationId: uuid('organisation_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
        email: text('email').notNull().unique(),
        passwordHash: text('password_hash').notNull(),
        role: text('role').notNull().default('member'),
        firstName: text('first_name'),
        lastName: text('last_name'),
        emailVerified: boolean('email_verified').notNull().default(false),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
        deletedAt: timestamp('deleted_at', { withTimezone: true }),
    },
    (t) => [index('users_org_id_idx').on(t.organisationId)],
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// ────────────────────────────────────────────────────────────────
// Password Reset Tokens
// ────────────────────────────────────────────────────────────────

export const passwordResetTokens = pgTable(
    'password_reset_tokens',
    {
        id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
        userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        tokenHash: text('token_hash').notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        usedAt: timestamp('used_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [index('prt_user_id_idx').on(t.userId)],
)

// ────────────────────────────────────────────────────────────────
// Projects
// ────────────────────────────────────────────────────────────────

export const projects = pgTable(
    'projects',
    {
        id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
        organisationId: uuid('organisation_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        slug: text('slug').notNull(),
        billingCurrency: text('billing_currency').notNull().default('USD'),
        environment: text('environment').notNull().default('production'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
        deletedAt: timestamp('deleted_at', { withTimezone: true }),
    },
    (t) => [
        unique('projects_org_slug_unique').on(t.organisationId, t.slug),
        index('projects_org_id_idx').on(t.organisationId),
    ],
)

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert

// ────────────────────────────────────────────────────────────────
// API Keys
// ────────────────────────────────────────────────────────────────

export const apiKeys = pgTable(
    'api_keys',
    {
        id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
        projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        /** SHA-256(rawKey + salt) — never store raw key */
        keyHash: text('key_hash').notNull().unique(),
        /** First 16 chars of the prefixed key — shown in UI for identification */
        keyPrefix: text('key_prefix').notNull(),
        scopes: text('scopes').array().notNull().default(['ingest']),
        lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
        expiresAt: timestamp('expires_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        revokedAt: timestamp('revoked_at', { withTimezone: true }),
    },
    (t) => [index('api_keys_project_id_idx').on(t.projectId)],
)

export type ApiKey = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert

// ────────────────────────────────────────────────────────────────
// Features
// ────────────────────────────────────────────────────────────────

export const features = pgTable(
    'features',
    {
        id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
        projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
        /** Machine-readable key used in SDK calls (e.g. "support_chat", "code_assistant") */
        key: text('key').notNull(),
        name: text('name').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        unique('features_project_key_unique').on(t.projectId, t.key),
        index('features_project_id_idx').on(t.projectId),
    ],
)

export type Feature = typeof features.$inferSelect
export type NewFeature = typeof features.$inferInsert

// ────────────────────────────────────────────────────────────────
// Tenants
// ────────────────────────────────────────────────────────────────

export const tenants = pgTable(
    'tenants',
    {
        id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
        projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
        /** Opaque external identifier — maps to your CRM/Stripe customer ID */
        externalRef: text('external_ref').notNull(),
        name: text('name'),
        /** JSON blob for custom metadata (sector, plan, etc.) */
        metadata: text('metadata'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        unique('tenants_project_ext_ref_unique').on(t.projectId, t.externalRef),
        index('tenants_project_id_idx').on(t.projectId),
    ],
)

export type Tenant = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert

// ────────────────────────────────────────────────────────────────
// Pricing Plans
// ────────────────────────────────────────────────────────────────

export const pricingPlans = pgTable('pricing_plans', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(),
    /** Unit price in microdollars */
    unitPriceMicro: integer('unit_price_micro').notNull().default(0),
    /** Included token quota before overage billing */
    includedQuota: integer('included_quota').notNull().default(0),
    /** Overage price in microdollars per token */
    overagePriceMicro: integer('overage_price_micro').notNull().default(0),
    currency: text('currency').notNull().default('USD'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const tenantPricingPlans = pgTable('tenant_pricing_plans', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    pricingPlanId: uuid('pricing_plan_id').notNull().references(() => pricingPlans.id),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
})

export type PricingPlan = typeof pricingPlans.$inferSelect
export type TenantPricingPlan = typeof tenantPricingPlans.$inferSelect

// ────────────────────────────────────────────────────────────────
// LLM Requests (core telemetry table)
// ────────────────────────────────────────────────────────────────

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
        id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
        projectId: uuid('project_id').notNull().references(() => projects.id),
        tenantId: uuid('tenant_id').references(() => tenants.id),
        /** Opaque end-user identifier — never PII */
        userId: text('user_id'),
        featureId: uuid('feature_id').references(() => features.id),

        provider: llmProviderEnum('provider').notNull(),
        model: text('model').notNull(),
        /** Provider-issued request/completion ID for deduplication */
        requestRef: text('request_ref'),

        tokensInput: integer('tokens_input').notNull().default(0),
        tokensOutput: integer('tokens_output').notNull().default(0),
        tokensTotal: integer('tokens_total').notNull().default(0),

        /** Actual provider cost in microdollars */
        costProviderMicro: integer('cost_provider_micro').notNull().default(0),
        /** Total cost (with markup) in microdollars */
        costTotalMicro: integer('cost_total_micro').notNull().default(0),
        /** Estimated revenue based on tenant pricing plan */
        revenueEstimatedMicro: integer('revenue_estimated_micro').default(0),

        latencyMs: integer('latency_ms'),
        environment: text('environment').notNull().default('production'),
        sdkVersion: text('sdk_version'),
        tags: text('tags').array(),

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

// ────────────────────────────────────────────────────────────────
// Budgets
// ────────────────────────────────────────────────────────────────

export const budgets = pgTable(
    'budgets',
    {
        id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
        projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
        tenantId: uuid('tenant_id').references(() => tenants.id),
        featureId: uuid('feature_id').references(() => features.id),
        name: text('name').notNull(),

        /** Scope determines which dimension this budget applies to */
        scope: text('scope').notNull(),

        /** Budget ceiling in microdollars */
        limitMicro: integer('limit_micro').notNull(),

        /** 'daily' | 'monthly' | 'rolling_30d' */
        period: text('period').notNull(),

        /** When true: API calls are blocked after 100% threshold */
        killSwitchEnabled: boolean('kill_switch_enabled').notNull().default(false),

        /** Percentage thresholds that trigger alerts, e.g. [80, 100] */
        alertThresholds: integer('alert_thresholds').array().notNull().default([80, 100]),

        isActive: boolean('is_active').notNull().default(true),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [index('budgets_project_id_idx').on(t.projectId)],
)

export type Budget = typeof budgets.$inferSelect
export type NewBudget = typeof budgets.$inferInsert

// ────────────────────────────────────────────────────────────────
// Budget Alerts
// ────────────────────────────────────────────────────────────────

export const budgetAlerts = pgTable(
    'budget_alerts',
    {
        id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
        budgetId: uuid('budget_id').notNull().references(() => budgets.id, { onDelete: 'cascade' }),
        threshold: integer('threshold').notNull(),
        /** 'email' | 'slack' */
        channel: text('channel').notNull(),
        /** Email address or Slack webhook URL */
        recipient: text('recipient').notNull(),
        firedAt: timestamp('fired_at', { withTimezone: true }),
        /** Period key to prevent duplicate alerts, e.g. "2026-03" for monthly */
        period: text('period').notNull(),
        readAt: timestamp('read_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [index('budget_alerts_budget_id_idx').on(t.budgetId)],
)

export type BudgetAlert = typeof budgetAlerts.$inferSelect
export type NewBudgetAlert = typeof budgetAlerts.$inferInsert

// ────────────────────────────────────────────────────────────────
// Model Pricing  (synced daily from LiteLLM price list)
// ────────────────────────────────────────────────────────────────

export const modelPricing = pgTable(
    'model_pricing',
    {
        id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
        /** Provider identifier (e.g. 'openai', 'groq') */
        provider: text('provider').notNull(),
        /** Exact model key as used in LiteLLM (e.g. 'groq/llama-3.3-70b-versatile') */
        model: text('model').notNull(),
        /** Cost in microdollars per input token (1 USD = 1 000 000 µ$) */
        inputMicroPerToken: integer('input_micro_per_token').notNull(),
        /** Cost in microdollars per output token */
        outputMicroPerToken: integer('output_micro_per_token').notNull(),
        /** Max context window in tokens (informational) */
        contextWindow: integer('context_window'),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        unique('model_pricing_model_unique').on(t.model),
        index('model_pricing_provider_idx').on(t.provider),
    ],
)

export type ModelPricing = typeof modelPricing.$inferSelect
export type NewModelPricing = typeof modelPricing.$inferInsert
