-- Migration 019: Add market_type enum and extend sources table
-- market_type categorizes the commercial context of a source (retail, used, auction, etc.)
-- This supports ADR-010 source classification for valuation and provenance tracking.

CREATE TYPE market_type AS ENUM (
  'retail',       -- manufacturer or authorized retailer selling new balls
  'used',         -- graded used ball retailer (LostGolfBalls, FoundGolfBalls)
  'recycled',     -- professionally cleaned/refinished lake balls
  'auction',      -- auction platforms (eBay, etc.)
  'marketplace',  -- peer-to-peer (Facebook Marketplace, Finn.no, forums)
  'reference'     -- non-pricing source (spec reference, review site)
);

ALTER TABLE sources
  ADD COLUMN market_type market_type,
  ADD COLUMN is_active   boolean NOT NULL DEFAULT true;

-- Backfill market_type based on existing source_type
UPDATE sources SET market_type = 'retail'    WHERE source_type = 'manufacturer';
UPDATE sources SET market_type = 'retail'    WHERE source_type = 'retailer' AND name NOT ILIKE '%lost%' AND name NOT ILIKE '%found%';
UPDATE sources SET market_type = 'used'      WHERE name ILIKE '%lost%' OR name ILIKE '%found%';
UPDATE sources SET market_type = 'reference' WHERE source_type IN ('review', 'community');

COMMENT ON COLUMN sources.market_type IS 'Commercial context of this source for pricing categorization.';
COMMENT ON COLUMN sources.is_active   IS 'Inactive sources are hidden from new observation entry but retained for history.';
