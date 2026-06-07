-- Migration: Row Level Security policies
-- Enables RLS on all tables and sets up the initial policy matrix.
-- Service role key bypasses RLS entirely (used by admin and import pipeline).
-- Policy intent:
--   Public:       SELECT on published data
--   Authenticated: No extra privileges in Phase 2
--   Admin writes: via service role only (bypasses RLS — no INSERT/UPDATE/DELETE policies needed)

-- ─────────────────────────────────────────────
-- Enable RLS on all tables
-- ─────────────────────────────────────────────
ALTER TABLE brands                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ball_families            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ball_versions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_specs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_signatures        ENABLE ROW LEVEL SECURITY;
ALTER TABLE identification_features  ENABLE ROW LEVEL SECURITY;
ALTER TABLE images                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_segments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_observations       ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- brands: public read (brands are always visible)
-- ─────────────────────────────────────────────
CREATE POLICY "brands_public_select"
  ON brands FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────
-- ball_families: public read for published and discontinued
-- ─────────────────────────────────────────────
CREATE POLICY "ball_families_public_select"
  ON ball_families FOR SELECT
  USING (status IN ('published', 'discontinued'));

-- ─────────────────────────────────────────────
-- ball_versions: public read for published and discontinued
-- ─────────────────────────────────────────────
CREATE POLICY "ball_versions_public_select"
  ON ball_versions FOR SELECT
  USING (status IN ('published', 'discontinued'));

-- ─────────────────────────────────────────────
-- technical_specs: readable when associated version is published/discontinued
-- ─────────────────────────────────────────────
CREATE POLICY "technical_specs_public_select"
  ON technical_specs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ball_versions v
      WHERE v.id = technical_specs.version_id
        AND v.status IN ('published', 'discontinued')
    )
  );

-- ─────────────────────────────────────────────
-- visual_signatures: same visibility as associated version
-- ─────────────────────────────────────────────
CREATE POLICY "visual_signatures_public_select"
  ON visual_signatures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ball_versions v
      WHERE v.id = visual_signatures.version_id
        AND v.status IN ('published', 'discontinued')
    )
  );

-- ─────────────────────────────────────────────
-- identification_features: same visibility as associated version
-- ─────────────────────────────────────────────
CREATE POLICY "identification_features_public_select"
  ON identification_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ball_versions v
      WHERE v.id = identification_features.version_id
        AND v.status IN ('published', 'discontinued')
    )
  );

-- ─────────────────────────────────────────────
-- images: same visibility as associated version
-- ─────────────────────────────────────────────
CREATE POLICY "images_public_select"
  ON images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ball_versions v
      WHERE v.id = images.version_id
        AND v.status IN ('published', 'discontinued')
    )
  );

-- ─────────────────────────────────────────────
-- segments: public read (reference data)
-- ─────────────────────────────────────────────
CREATE POLICY "segments_public_select"
  ON segments FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────
-- version_segments: readable when version is visible
-- ─────────────────────────────────────────────
CREATE POLICY "version_segments_public_select"
  ON version_segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ball_versions v
      WHERE v.id = version_segments.version_id
        AND v.status IN ('published', 'discontinued')
    )
  );

-- ─────────────────────────────────────────────
-- sources: public read (provenance is transparent)
-- ─────────────────────────────────────────────
CREATE POLICY "sources_public_select"
  ON sources FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────
-- price_observations: public read for prices of visible versions
-- ─────────────────────────────────────────────
CREATE POLICY "price_observations_public_select"
  ON price_observations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ball_versions v
      WHERE v.id = price_observations.version_id
        AND v.status IN ('published', 'discontinued')
    )
  );
