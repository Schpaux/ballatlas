-- Phase 5: Enable pg_trgm for fuzzy search (ADR-012)
-- Adds trigram GIN indexes to enable ilike to use index scans and support
-- fuzzy matching. Coexists with existing FTS search_vector indexes.
-- See docs/decisions/ADR-012-fuzzy-search.md

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_ball_versions_name_trgm
  ON ball_versions USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_brands_name_trgm
  ON brands USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_ball_families_name_trgm
  ON ball_families USING GIN (name gin_trgm_ops);
