-- Migration: ball_versions table
-- Leaf node: a specific release year/generation of a family.
-- Each version is an independently identifiable product (Pro V1 2025 ≠ Pro V1 2023).

CREATE TABLE ball_versions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     uuid        NOT NULL REFERENCES ball_families(id) ON DELETE RESTRICT,
  name          text        NOT NULL,
  -- Globally unique slug: {brand-slug}-{family-slug}-{year}
  -- e.g. titleist-pro-v1-2025
  slug          text        NOT NULL UNIQUE,
  release_year  int         CHECK (release_year >= 1900 AND release_year <= 2100),
  release_date  date,
  msrp_usd      numeric(10, 2) CHECK (msrp_usd > 0),
  msrp_nok      numeric(10, 2) CHECK (msrp_nok > 0),
  status        ball_status NOT NULL DEFAULT 'published',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER ball_versions_updated_at
  BEFORE UPDATE ON ball_versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Composite FTS: version name (A) + joined family.name (B) + brand.name (C)
-- resolved at query time via join; the column covers only the version name.
-- Cross-entity search is handled at the API layer with a join.
ALTER TABLE ball_versions
  ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(name, '')), 'A')
    ) STORED;

CREATE INDEX ball_versions_family_id_idx      ON ball_versions (family_id);
CREATE INDEX ball_versions_slug_idx           ON ball_versions (slug);
CREATE INDEX ball_versions_release_year_idx   ON ball_versions (release_year);
CREATE INDEX ball_versions_status_idx         ON ball_versions (status);
CREATE INDEX ball_versions_search_vector_idx  ON ball_versions USING GIN (search_vector);

COMMENT ON TABLE  ball_versions            IS 'Individual year/generation releases. Each is an independently identifiable product.';
COMMENT ON COLUMN ball_versions.slug       IS 'Globally unique. Convention: {brand}-{family}-{year}, e.g. titleist-pro-v1-2025.';
COMMENT ON COLUMN ball_versions.msrp_usd  IS 'Manufacturer suggested retail price in USD at launch (1 dozen).';
COMMENT ON COLUMN ball_versions.msrp_nok  IS 'Manufacturer suggested retail price in NOK at launch (1 dozen).';
