-- Fix ball_versions.search_vector to include brand and family names.
-- The original GENERATED ALWAYS AS column only indexed the version's own name,
-- so searching "nike" returned 0 results because brand names live in the brands table.
-- We replace it with a trigger-maintained tsvector that pulls from the full hierarchy.

-- 1. Drop the generated column and its index
DROP INDEX IF EXISTS ball_versions_search_vector_idx;
ALTER TABLE ball_versions DROP COLUMN IF EXISTS search_vector;

-- 2. Add a plain tsvector column
ALTER TABLE ball_versions ADD COLUMN search_vector tsvector;

-- 3. Trigger function: update search_vector on ball_versions insert/update
CREATE OR REPLACE FUNCTION ball_versions_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  SELECT
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A')
    || setweight(to_tsvector('english', coalesce(f.name, '')), 'B')
    || setweight(to_tsvector('english', coalesce(b.name, '')), 'B')
  INTO NEW.search_vector
  FROM ball_families f
  JOIN brands b ON b.id = f.brand_id
  WHERE f.id = NEW.family_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trig_ball_versions_search_vector
BEFORE INSERT OR UPDATE OF name, family_id
ON ball_versions
FOR EACH ROW EXECUTE FUNCTION ball_versions_search_vector_update();

-- 4. Trigger function: propagate brand name changes to all their versions
CREATE OR REPLACE FUNCTION brands_propagate_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE ball_versions v
  SET search_vector =
    setweight(to_tsvector('english', coalesce(v.name, '')), 'A')
    || setweight(to_tsvector('english', coalesce(f.name, '')), 'B')
    || setweight(to_tsvector('english', coalesce(NEW.name, '')), 'B')
  FROM ball_families f
  WHERE f.brand_id = NEW.id
    AND v.family_id = f.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trig_brands_propagate_search_vector
AFTER UPDATE OF name ON brands
FOR EACH ROW EXECUTE FUNCTION brands_propagate_search_vector();

-- 5. Trigger function: propagate family name changes to all their versions
CREATE OR REPLACE FUNCTION ball_families_propagate_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE ball_versions v
  SET search_vector =
    setweight(to_tsvector('english', coalesce(v.name, '')), 'A')
    || setweight(to_tsvector('english', coalesce(NEW.name, '')), 'B')
    || setweight(to_tsvector('english', coalesce(b.name, '')), 'B')
  FROM brands b
  WHERE b.id = NEW.brand_id
    AND v.family_id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trig_ball_families_propagate_search_vector
AFTER UPDATE OF name ON ball_families
FOR EACH ROW EXECUTE FUNCTION ball_families_propagate_search_vector();

-- 6. Backfill all existing rows
UPDATE ball_versions SET name = name;

-- 7. Recreate GIN index
CREATE INDEX ball_versions_search_vector_idx ON ball_versions USING GIN (search_vector);
