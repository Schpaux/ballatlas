-- Migration 018: Extend price_observations for Phase 4 market data workflow
-- Adds: is_archived (soft-delete), notes (context field)
-- market_type is captured via the source's source_type enum (already exists)

ALTER TABLE price_observations
  ADD COLUMN is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN notes       text;

-- Index so active observations are fast to query
CREATE INDEX price_observations_active_idx
  ON price_observations (version_id, condition, observed_at DESC)
  WHERE is_archived = false;

COMMENT ON COLUMN price_observations.is_archived IS 'Archived observations are excluded from valuation but retained for history.';
COMMENT ON COLUMN price_observations.notes       IS 'Optional context: sale event, condition notes, data quality flags.';
