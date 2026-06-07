-- Migration: brands table
-- Top of the Brand → Family → Version hierarchy.

CREATE TABLE brands (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  country     text,
  website     text,
  logo_url    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Full-text search vector (generated stored column).
-- Weighted only on name; description added if brands get one in future.
ALTER TABLE brands
  ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, ''))) STORED;

CREATE INDEX brands_search_vector_idx ON brands USING GIN (search_vector);
CREATE INDEX brands_slug_idx          ON brands (slug);

COMMENT ON TABLE  brands            IS 'Top-level golf ball manufacturers and brands.';
COMMENT ON COLUMN brands.slug       IS 'URL-safe unique identifier. Format: lowercase-hyphenated.';
COMMENT ON COLUMN brands.logo_url   IS 'Supabase Storage path or external URL for brand logo.';
