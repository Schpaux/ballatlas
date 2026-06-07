-- Migration: segments table + seed data
-- Reference table for market segments. Static reference data seeded here
-- rather than in seed.sql because segments are part of the schema definition.

CREATE TABLE segments (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text  NOT NULL UNIQUE,
  slug        text  NOT NULL UNIQUE,
  description text,
  sort_order  int   NOT NULL DEFAULT 0
);

COMMENT ON TABLE segments IS 'Market segment classifications. Static reference data.';

-- Seed the 6 standard market segments (from research report section 1)
INSERT INTO segments (name, slug, description, sort_order) VALUES
  ('Tour Premium',
   'tour-premium',
   'Flagship tour-level balls: multi-layer urethane cover, maximum spin and control. Used by tour professionals.',
   1),
  ('Performance',
   'performance',
   'High-performance balls balancing distance and control. Often 3-4 layers with urethane cover at a lower price point than Tour Premium.',
   2),
  ('Distance',
   'distance',
   'Two-layer or low-compression balls designed for maximum distance and minimal backspin. Popular with beginners and high-handicap players.',
   3),
  ('Soft Feel',
   'soft-feel',
   'Low-compression balls with extra-soft feel, popular with players with slower swing speeds.',
   4),
  ('Value',
   'value',
   'Budget-friendly balls for casual play. Includes off-brand and generic options.',
   5),
  ('Lake Ball',
   'lake-ball',
   'Recycled balls retrieved from water hazards. Graded by condition (A/B/C). Very low price point.',
   6);
