-- ============================================================
--  Mintlens — seed demo user with full dataset
--  Run: docker exec -i mintlens_postgres psql -U mintlens -d mintlens_dev < seed-demo.sql
-- ============================================================

DO $$
DECLARE
  v_org_id        UUID := '11111111-0000-0000-0000-000000000001';
  v_user_id       UUID := '22222222-0000-0000-0000-000000000001';
  v_proj_main     UUID := '33333333-0000-0000-0000-000000000001';
  v_proj_internal UUID := '33333333-0000-0000-0000-000000000002';
  v_apikey_id     UUID := '44444444-0000-0000-0000-000000000001';
  v_feat_chat     UUID := '55555555-0000-0000-0000-000000000001';
  v_feat_summary  UUID := '55555555-0000-0000-0000-000000000002';
  v_feat_search   UUID := '55555555-0000-0000-0000-000000000003';
  v_tenant_acme   UUID := '66666666-0000-0000-0000-000000000001';
  v_tenant_globex UUID := '66666666-0000-0000-0000-000000000002';
  v_tenant_initec UUID := '66666666-0000-0000-0000-000000000003';
  v_budget_proj   UUID := '77777777-0000-0000-0000-000000000001';
  v_budget_tenant UUID := '77777777-0000-0000-0000-000000000002';
  v_d             DATE;
  v_prov          llm_provider;
  v_model         TEXT;
  v_feat          UUID;
  v_tenant        UUID;
  v_tin           INT;
  v_tout          INT;
  v_cost          INT;
  v_lat           INT;
  v_env           TEXT;
BEGIN

-- ── 1. Organisation ──────────────────────────────────────────
INSERT INTO organisations (id, name, slug, plan_tier)
VALUES (v_org_id, 'Acme Corp', 'acme-corp', 'pro')
ON CONFLICT (id) DO NOTHING;

-- ── 2. User (password: Demo1234!) ────────────────────────────
-- hash = bcrypt('Demo1234!', 10)
INSERT INTO users (id, organisation_id, email, password_hash, role, first_name, last_name, email_verified)
VALUES (
  v_user_id, v_org_id,
  'demo@mintlens.dev',
  '$2a$10$eGZVGTUCxkhKrhCwPfEFYODNiH3vQVpEet0QTF2s0/Ncorj2ZQa2S',
  'owner', 'Alex', 'Demo', true
)
ON CONFLICT (email) DO NOTHING;

-- ── 3. Projects ───────────────────────────────────────────────
INSERT INTO projects (id, organisation_id, name, slug, environment)
VALUES
  (v_proj_main,     v_org_id, 'Customer Platform', 'customer-platform', 'production'),
  (v_proj_internal, v_org_id, 'Internal Tools',    'internal-tools',    'staging')
ON CONFLICT (id) DO NOTHING;

-- ── 4. API Key ────────────────────────────────────────────────
-- Raw key (save this!): mlk_live_254cac6119bddff58017b206d759df4a42344af1339ba987
INSERT INTO api_keys (id, project_id, name, key_hash, key_prefix, scopes)
VALUES (
  v_apikey_id, v_proj_main,
  'Production SDK Key',
  '9eca04586dbb314d259b75e8e1e69b2201ab85ebea68e6e47c133e802a8298de',
  'mlk_live_254cac6',
  ARRAY['ingest','read']
)
ON CONFLICT (id) DO NOTHING;

-- ── 5. Features ───────────────────────────────────────────────
INSERT INTO features (id, project_id, key, name)
VALUES
  (v_feat_chat,    v_proj_main, 'support_chat',    'Support Chat'),
  (v_feat_summary, v_proj_main, 'doc_summary',     'Document Summary'),
  (v_feat_search,  v_proj_main, 'semantic_search', 'Semantic Search')
ON CONFLICT (id) DO NOTHING;

-- ── 6. Tenants ────────────────────────────────────────────────
INSERT INTO tenants (id, project_id, external_ref, name)
VALUES
  (v_tenant_acme,   v_proj_main, 'cust_acme_001',  'Acme Industries'),
  (v_tenant_globex, v_proj_main, 'cust_globex_002', 'Globex Corp'),
  (v_tenant_initec, v_proj_main, 'cust_initec_003', 'Initech Ltd')
ON CONFLICT (id) DO NOTHING;

-- ── 7. Budgets ────────────────────────────────────────────────
INSERT INTO budgets (id, project_id, name, scope, limit_micro, period, kill_switch_enabled, alert_thresholds)
VALUES
  (v_budget_proj,   v_proj_main, 'Monthly project cap', 'project', 500000000, 'monthly',     false, ARRAY[75, 90, 100]),
  (v_budget_tenant, v_proj_main, 'Acme tenant limit',   'tenant',  80000000,  'rolling_30d', true,  ARRAY[80, 95, 100])
ON CONFLICT (id) DO NOTHING;

-- ── 8. llm_requests — 60 jours de données réalistes ──────────
FOR v_d IN SELECT gs::date FROM generate_series(
  CURRENT_DATE - INTERVAL '59 days',
  CURRENT_DATE,
  INTERVAL '1 day'
) gs LOOP
  FOR i IN 1..( 15 + floor(random()*30)::int ) LOOP

    -- Distribution providers/modèles
    CASE floor(random()*5)::int
      WHEN 0 THEN v_prov := 'openai';    v_model := CASE WHEN random()>0.5 THEN 'gpt-4o' ELSE 'gpt-4o-mini' END;
      WHEN 1 THEN v_prov := 'anthropic'; v_model := CASE WHEN random()>0.5 THEN 'claude-3-5-sonnet-20241022' ELSE 'claude-3-haiku-20240307' END;
      WHEN 2 THEN v_prov := 'google';    v_model := 'gemini-1.5-pro';
      WHEN 3 THEN v_prov := 'groq';      v_model := 'groq/llama-3.3-70b-versatile';
      ELSE        v_prov := 'openai';    v_model := 'gpt-4o-mini';
    END CASE;

    -- Feature
    CASE floor(random()*3)::int
      WHEN 0 THEN v_feat := v_feat_chat;
      WHEN 1 THEN v_feat := v_feat_summary;
      ELSE        v_feat := v_feat_search;
    END CASE;

    -- Tenant (null 20% du temps, Acme plus fréquent)
    CASE floor(random()*5)::int
      WHEN 0 THEN v_tenant := NULL;
      WHEN 1 THEN v_tenant := v_tenant_acme;
      WHEN 2 THEN v_tenant := v_tenant_acme;
      WHEN 3 THEN v_tenant := v_tenant_globex;
      ELSE        v_tenant := v_tenant_initec;
    END CASE;

    -- Tokens réalistes
    v_tin  := CASE
      WHEN v_model = 'gpt-4o'                     THEN 500  + floor(random()*2000)::int
      WHEN v_model = 'claude-3-5-sonnet-20241022'  THEN 800  + floor(random()*3000)::int
      ELSE                                              300  + floor(random()*1500)::int
    END;
    v_tout := v_tin / 3 + floor(random()*500)::int;

    -- Coût microdollars (basé sur tarifs publics approximatifs)
    v_cost := CASE v_model
      WHEN 'gpt-4o'                     THEN (v_tin * 5  + v_tout * 15)
      WHEN 'gpt-4o-mini'                THEN (v_tin / 10 + v_tout / 5)
      WHEN 'claude-3-5-sonnet-20241022' THEN (v_tin * 3  + v_tout * 15)
      WHEN 'claude-3-haiku-20240307'    THEN (v_tin / 4  + v_tout / 2)
      WHEN 'gemini-1.5-pro'             THEN (v_tin * 4  + v_tout * 12)
      ELSE                                   (v_tin / 20 + v_tout / 10)
    END;

    v_lat := 400 + floor(random()*1600)::int;
    v_env := CASE WHEN random() > 0.1 THEN 'production' ELSE 'staging' END;

    INSERT INTO llm_requests (
      id, project_id, tenant_id, feature_id,
      provider, model,
      tokens_input, tokens_output, tokens_total,
      cost_provider_micro, cost_total_micro,
      latency_ms, environment, created_at
    ) VALUES (
      gen_random_uuid(), v_proj_main, v_tenant, v_feat,
      v_prov, v_model,
      v_tin, v_tout, v_tin + v_tout,
      v_cost, (v_cost * 1.1)::int,
      v_lat, v_env,
      v_d + (random() * INTERVAL '23 hours')
    );

  END LOOP;
END LOOP;

RAISE NOTICE 'Seed completed successfully.';
END $$;

-- Vérification
SELECT tbl, cnt FROM (
  SELECT 'organisations' AS tbl, count(*)::int AS cnt FROM organisations WHERE id = '11111111-0000-0000-0000-000000000001'
  UNION ALL SELECT 'users',        count(*)::int FROM users    WHERE email = 'demo@mintlens.dev'
  UNION ALL SELECT 'projects',     count(*)::int FROM projects WHERE organisation_id = '11111111-0000-0000-0000-000000000001'
  UNION ALL SELECT 'api_keys',     count(*)::int FROM api_keys WHERE project_id = '33333333-0000-0000-0000-000000000001'
  UNION ALL SELECT 'features',     count(*)::int FROM features WHERE project_id = '33333333-0000-0000-0000-000000000001'
  UNION ALL SELECT 'tenants',      count(*)::int FROM tenants  WHERE project_id = '33333333-0000-0000-0000-000000000001'
  UNION ALL SELECT 'budgets',      count(*)::int FROM budgets  WHERE project_id = '33333333-0000-0000-0000-000000000001'
  UNION ALL SELECT 'llm_requests', count(*)::int FROM llm_requests WHERE project_id = '33333333-0000-0000-0000-000000000001'
) t ORDER BY tbl;
