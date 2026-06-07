-- Migration: ball_families table
-- Mid-tier: a named model line under a brand (Pro V1, Chrome Soft, TP5...).
-- A family groups all year-releases of the same model.

CREATE TABLE ball_families (
  id                 uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id           uuid         NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  name               text         NOT NULL,
  slug               text         NOT NULL,
  description        text,
  first_release_year int          CHECK (first_release_year >= 1900 AND first_release_year <= 2100),
  last_release_year  int          CHECK (last_release_year  >= 1900 AND last_release_year  <= 2100),
  status             ball_status  NOT NULL DEFAULT 'published',
  created_at         timestamptz  NOT NULL DEFAULT now(),
  updated_at         timestamptz  NOT NULL DEFAULT now(),

  -- Slug is unique within a brand (not globally — "pro-v1" exists only under Titleist)
  UNIQUE (brand_id, slug),

  -- Temporal sanity check
  CHECK (last_release_year IS NULL OR first_release_year IS NULL
         OR last_release_year >= first_release_year)
);

CREATE TRIGGER ball_families_updated_at
  BEFORE UPDATE ON ball_families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE ball_families
  ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        coalesce(name, '') || ' ' || coalesce(description, ''))
    ) STORED;

CREATE INDEX ball_families_brand_id_idx      ON ball_families (brand_id);
CREATE INDEX ball_families_search_vector_idx ON ball_families USING GIN (search_vector);
CREATE INDEX ball_families_status_idx        ON ball_families (status);

COMMENT ON TABLE  ball_families             IS 'Model families: Pro V1, Chrome Soft, TP5, etc.';
COMMENT ON COLUMN ball_families.slug        IS 'Unique within brand. Format: lowercase-hyphenated.';
COMMENT ON COLUMN ball_families.description IS 'Marketing or editorial description of the family.';
