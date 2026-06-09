-- Phase 6: Brand assets table
-- Manages brand logos, marks, and other brand-level visual assets.
-- Separate from the `images` table which is scoped to ball_versions.
-- See ADR-013 for the asset management strategy.

CREATE TABLE brand_assets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id         uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  asset_type       brand_asset_type NOT NULL,
  storage_path     text NOT NULL,
  mime_type        text NOT NULL,
  file_size_bytes  integer,
  source_url       text,
  attribution      text,
  license          text,
  alt_text         text,
  review_status    asset_review_status NOT NULL DEFAULT 'uploaded',
  quality_score    integer CHECK (quality_score BETWEEN 1 AND 10),
  uploaded_at      timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Index for logo resolution queries (brand page logo fallback chain)
CREATE INDEX brand_assets_brand_status_idx ON brand_assets (brand_id, asset_type, review_status);

-- Auto-update trigger
CREATE TRIGGER set_brand_assets_updated_at
  BEFORE UPDATE ON brand_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: public read for approved assets only
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read approved brand assets"
  ON brand_assets FOR SELECT
  USING (review_status = 'approved');

CREATE POLICY "Service role can manage brand assets"
  ON brand_assets FOR ALL
  USING (true)
  WITH CHECK (true);
