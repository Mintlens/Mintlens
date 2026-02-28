-- ============================================================
-- Mintlens — Initial schema migration
-- Generated: 2026-03-03
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Enums ────────────────────────────────────────────────────
CREATE TYPE llm_provider AS ENUM (
  'openai', 'anthropic', 'google', 'mistral', 'cohere', 'other'
);

-- ── Core tables ──────────────────────────────────────────────
CREATE TABLE organisations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  plan_tier   TEXT NOT NULL DEFAULT 'free',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'member',
  first_name       TEXT,
  last_name        TEXT,
  email_verified   BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);
CREATE INDEX users_org_id_idx ON users(organisation_id);

CREATE TABLE projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL,
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  UNIQUE(organisation_id, slug)
);
CREATE INDEX projects_org_id_idx ON projects(organisation_id);

CREATE TABLE api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  key_hash     TEXT NOT NULL UNIQUE,
  key_prefix   TEXT NOT NULL,
  scopes       TEXT[] NOT NULL DEFAULT '{ingest}',
  last_used_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at   TIMESTAMPTZ
);
CREATE INDEX api_keys_project_id_idx ON api_keys(project_id);

CREATE TABLE features (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  UNIQUE(project_id, key)
);
CREATE INDEX features_project_id_idx ON features(project_id);

CREATE TABLE tenants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  external_ref TEXT NOT NULL,
  name         TEXT NOT NULL,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, external_ref)
);
CREATE INDEX tenants_project_id_idx ON tenants(project_id);

CREATE TABLE pricing_plans (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id       UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  unit_price_micro      INTEGER NOT NULL DEFAULT 0,
  included_quota        INTEGER NOT NULL DEFAULT 0,
  overage_price_micro   INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Core telemetry table ──────────────────────────────────────
-- Write-heavy. Privacy guarantee: no prompt or response content stored.
CREATE TABLE llm_requests (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id               UUID NOT NULL REFERENCES projects(id),
  tenant_id                UUID REFERENCES tenants(id),
  user_id                  TEXT,
  feature_id               UUID REFERENCES features(id),

  provider                 llm_provider NOT NULL,
  model                    TEXT NOT NULL,
  request_ref              TEXT,

  tokens_input             INTEGER NOT NULL DEFAULT 0,
  tokens_output            INTEGER NOT NULL DEFAULT 0,
  tokens_total             INTEGER NOT NULL DEFAULT 0,

  cost_provider_micro      INTEGER NOT NULL DEFAULT 0,
  cost_total_micro         INTEGER NOT NULL DEFAULT 0,
  revenue_estimated_micro  INTEGER DEFAULT 0,

  latency_ms               INTEGER,
  environment              TEXT NOT NULL DEFAULT 'production',
  sdk_version              TEXT,
  tags                     TEXT[],

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytical indexes (all queries filter by project + time range)
CREATE INDEX llm_req_project_created_at_idx ON llm_requests(project_id, created_at DESC);
CREATE INDEX llm_req_tenant_created_at_idx  ON llm_requests(tenant_id,  created_at DESC);
CREATE INDEX llm_req_feature_created_at_idx ON llm_requests(feature_id, created_at DESC);
CREATE INDEX llm_req_provider_model_idx     ON llm_requests(provider, model);

-- ── Budget tables ─────────────────────────────────────────────
CREATE TABLE budgets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scope             TEXT NOT NULL DEFAULT 'project', -- 'project' | 'tenant' | 'feature'
  scope_id          UUID,
  limit_micro       INTEGER NOT NULL,
  period            TEXT NOT NULL DEFAULT 'monthly', -- 'daily' | 'monthly' | 'rolling_30d'
  kill_switch       BOOLEAN NOT NULL DEFAULT false,
  alert_thresholds  INTEGER[] NOT NULL DEFAULT '{80,100}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX budgets_project_id_idx ON budgets(project_id);

CREATE TABLE budget_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id   UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  threshold   INTEGER NOT NULL,
  channel     TEXT NOT NULL DEFAULT 'email', -- 'email' | 'slack'
  recipient   TEXT NOT NULL,
  period      TEXT NOT NULL, -- deduplication key (YYYY-MM for monthly)
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX budget_alerts_budget_id_idx ON budget_alerts(budget_id);

-- ============================================================
-- Row-Level Security (RLS)
-- All data is scoped to organisation_id.
-- The application sets: SET LOCAL app.organisation_id = '<uuid>';
-- ============================================================

ALTER TABLE organisations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys         ENABLE ROW LEVEL SECURITY;
ALTER TABLE features         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans    ENABLE ROW LEVEL SECURITY;

-- Create the application role (used by the API)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mintlens_app') THEN
    CREATE ROLE mintlens_app;
  END IF;
END
$$;

-- Organisation: read/write own org only
CREATE POLICY org_isolation ON organisations
  FOR ALL TO mintlens_app
  USING (id = current_setting('app.organisation_id', true)::UUID);

-- Users: own org only
CREATE POLICY users_isolation ON users
  FOR ALL TO mintlens_app
  USING (organisation_id = current_setting('app.organisation_id', true)::UUID);

-- Projects: own org only
CREATE POLICY projects_isolation ON projects
  FOR ALL TO mintlens_app
  USING (organisation_id = current_setting('app.organisation_id', true)::UUID);

-- API keys: via projects → org
CREATE POLICY api_keys_isolation ON api_keys
  FOR ALL TO mintlens_app
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE organisation_id = current_setting('app.organisation_id', true)::UUID
    )
  );

-- Features: via projects → org
CREATE POLICY features_isolation ON features
  FOR ALL TO mintlens_app
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE organisation_id = current_setting('app.organisation_id', true)::UUID
    )
  );

-- Tenants: via projects → org
CREATE POLICY tenants_isolation ON tenants
  FOR ALL TO mintlens_app
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE organisation_id = current_setting('app.organisation_id', true)::UUID
    )
  );

-- LLM requests: via projects → org
CREATE POLICY llm_requests_isolation ON llm_requests
  FOR ALL TO mintlens_app
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE organisation_id = current_setting('app.organisation_id', true)::UUID
    )
  );

-- Budgets: via projects → org
CREATE POLICY budgets_isolation ON budgets
  FOR ALL TO mintlens_app
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE organisation_id = current_setting('app.organisation_id', true)::UUID
    )
  );

-- Budget alerts: via budgets → projects → org
CREATE POLICY budget_alerts_isolation ON budget_alerts
  FOR ALL TO mintlens_app
  USING (
    budget_id IN (
      SELECT b.id FROM budgets b
      JOIN projects p ON b.project_id = p.id
      WHERE p.organisation_id = current_setting('app.organisation_id', true)::UUID
    )
  );

-- Pricing plans: own org only
CREATE POLICY pricing_plans_isolation ON pricing_plans
  FOR ALL TO mintlens_app
  USING (organisation_id = current_setting('app.organisation_id', true)::UUID);

-- Grant permissions to app role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mintlens_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mintlens_app;
