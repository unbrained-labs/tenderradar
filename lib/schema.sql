-- TenderRadar Schema
-- Run this once against your Neon database to set up the schema.
-- Usage: psql $DATABASE_URL -f lib/schema.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- ============================================================
-- TENDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS tenders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       TEXT NOT NULL UNIQUE,         -- prefix:id e.g. simap-123, ted-456-2026, fts-ocid, sam-uuid
  title           TEXT NOT NULL,
  description     TEXT,
  issuer_name     TEXT NOT NULL DEFAULT '',
  issuer_country  CHAR(2),                      -- ISO 3166-1 alpha-2 (CH, GB, US, FR, DE...)
  issuer_region   VARCHAR(10),                  -- sub-national region: CH canton (GR, ZH), US state (CA, TX), UK region (UKJ14)...
  cpv_codes       JSONB NOT NULL DEFAULT '[]',  -- ["45221200", "72200000"]
  posted_date     TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  estimated_value_min NUMERIC,
  estimated_value_max NUMERIC,
  currency        CHAR(3) NOT NULL DEFAULT 'CHF',
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'cancelled', 'awarded', 'expired')),
  source_url      TEXT NOT NULL DEFAULT '',
  attachments     JSONB NOT NULL DEFAULT '[]',  -- [{name, url, size_bytes}]
  contacts        JSONB NOT NULL DEFAULT '[]',  -- [{name, email, phone, role}]
  raw             JSONB,                        -- original API response for debugging
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenders_status          ON tenders (status);
CREATE INDEX IF NOT EXISTS idx_tenders_country         ON tenders (issuer_country);
CREATE INDEX IF NOT EXISTS idx_tenders_region          ON tenders (issuer_region);
CREATE INDEX IF NOT EXISTS idx_tenders_deadline        ON tenders (response_deadline);
CREATE INDEX IF NOT EXISTS idx_tenders_posted          ON tenders (posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_tenders_cpv_codes       ON tenders USING gin (cpv_codes);
CREATE INDEX IF NOT EXISTS idx_tenders_title_trgm      ON tenders USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tenders_description_trgm ON tenders USING gin (description gin_trgm_ops);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenders_updated_at ON tenders;
CREATE TRIGGER tenders_updated_at
  BEFORE UPDATE ON tenders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PROFILE (single company profile for MVP, one row)
-- ============================================================
CREATE TABLE IF NOT EXISTS profile (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name    TEXT NOT NULL DEFAULT '',
  cpv_codes       JSONB NOT NULL DEFAULT '[]',  -- company's relevant CPV codes
  cantons         JSONB NOT NULL DEFAULT '[]',  -- ["GR", "VS", "TI"]
  keywords        JSONB NOT NULL DEFAULT '[]',  -- ["avalanche", "SCADA", "tunnel"]
  value_min       NUMERIC,
  value_max       NUMERIC,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS profile_updated_at ON profile;
CREATE TRIGGER profile_updated_at
  BEFORE UPDATE ON profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default empty profile if none exists
INSERT INTO profile (company_name, cpv_codes, cantons, keywords)
VALUES ('My Company', '[]', '[]', '[]')
ON CONFLICT DO NOTHING;

-- ============================================================
-- TRACKED TENDERS (bid pipeline)
-- ============================================================
CREATE TABLE IF NOT EXISTS tracked_tenders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id       UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'reviewing', 'bid', 'no_bid', 'submitted', 'won', 'lost')),
  notes           TEXT,
  assigned_to     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tender_id)  -- one tracker entry per tender
);

CREATE INDEX IF NOT EXISTS idx_tracked_status     ON tracked_tenders (status);
CREATE INDEX IF NOT EXISTS idx_tracked_tender_id  ON tracked_tenders (tender_id);

DROP TRIGGER IF EXISTS tracked_updated_at ON tracked_tenders;
CREATE TRIGGER tracked_updated_at
  BEFORE UPDATE ON tracked_tenders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SYNC LOG (track API sync history)
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT NOT NULL DEFAULT 'simap.ch',
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ,
  records_fetched INT NOT NULL DEFAULT 0,
  records_upserted INT NOT NULL DEFAULT 0,
  error           TEXT,
  status          TEXT NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running', 'success', 'error'))
);
