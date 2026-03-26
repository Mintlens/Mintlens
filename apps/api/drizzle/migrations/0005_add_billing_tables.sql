ALTER TABLE organisations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL UNIQUE REFERENCES organisations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_org_id_idx ON subscriptions(organisation_id);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  amount_paid INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  invoice_url TEXT,
  invoice_pdf TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoices_org_id_idx ON invoices(organisation_id);

CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  tokens_total INTEGER NOT NULL DEFAULT 0,
  cost_total_micro INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organisation_id, period)
);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
