-- Phase 6: Brand identity color columns
-- Optional editorial metadata for brand identity.
-- Stored as CSS hex strings (e.g. '#e31837') or named colors.
-- Used for future UI theming, API consumers, and comparison views.

ALTER TABLE brands
  ADD COLUMN primary_color   text,
  ADD COLUMN secondary_color text;
