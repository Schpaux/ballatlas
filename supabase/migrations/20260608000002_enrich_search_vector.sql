-- Enrich ball_versions.search_vector to cover all searchable ball attributes.
--
-- Previous migration (20260608000001) added brand + family name to the vector.
-- This migration extends coverage to technical specs, visual signatures, segments,
-- and high-importance identification features, then adds triggers so every related
-- table keeps the vector current.
--
-- Weight strategy:
--   A — version name              (highest relevance)
--   B — brand name, family name   (entity names people commonly search)
--   C — all descriptive content   (specs, materials, color, segments, features, notes)

-- ─── Helper: full recompute for a single version ────────────────────────────
-- Called by all external triggers (technical_specs, visual_signatures, etc.).
-- External triggers update ball_versions.search_vector directly, which does NOT
-- fire the ball_versions BEFORE trigger (trigger is restricted to name/family_id).

CREATE OR REPLACE FUNCTION rebuild_ball_version_search_vector(p_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_name          text;
  v_family_name   text;
  v_family_desc   text;
  v_brand_name    text;
  v_cover         text;
  v_core          text;
  v_dimple        text;
  v_notes         text;
  v_launch        text;
  v_spin          text;
  v_feel          text;
  v_logo_text     text;
  v_alignment     text;
  v_special       text;
  v_color         text;
  v_segments      text;
  v_features      text;
BEGIN
  SELECT v.name, f.name, f.description, b.name
  INTO v_name, v_family_name, v_family_desc, v_brand_name
  FROM ball_versions v
  JOIN ball_families f ON f.id = v.family_id
  JOIN brands b        ON b.id = f.brand_id
  WHERE v.id = p_id;

  SELECT ts.cover_material,
         ts.core_material,
         ts.dimple_pattern,
         ts.notes,
         ts.launch_profile::text,
         ts.spin_profile::text,
         ts.feel_profile::text
  INTO v_cover, v_core, v_dimple, v_notes, v_launch, v_spin, v_feel
  FROM technical_specs ts
  WHERE ts.version_id = p_id;

  SELECT vs.logo_text,
         vs.alignment_marking,
         vs.special_markings,
         vs.primary_color
  INTO v_logo_text, v_alignment, v_special, v_color
  FROM visual_signatures vs
  WHERE vs.version_id = p_id;

  SELECT string_agg(DISTINCT s.name, ' ')
  INTO v_segments
  FROM version_segments vseg
  JOIN segments s ON s.id = vseg.segment_id
  WHERE vseg.version_id = p_id;

  -- High-importance features only (brand_text=10, model_text=10, logo=9, alignment=9, color=8)
  SELECT string_agg(DISTINCT idf.feature_value, ' ')
  INTO v_features
  FROM identification_features idf
  WHERE idf.version_id = p_id AND idf.importance_score >= 7;

  UPDATE ball_versions
  SET search_vector =
    setweight(to_tsvector('english', coalesce(v_name, '')), 'A')
    || setweight(to_tsvector('english',
         coalesce(v_brand_name, '') || ' ' || coalesce(v_family_name, '')), 'B')
    || setweight(to_tsvector('english',
         coalesce(v_family_desc, '')  || ' '
         || coalesce(v_cover, '')     || ' '
         || coalesce(v_core, '')      || ' '
         || coalesce(v_dimple, '')    || ' '
         || coalesce(v_logo_text, '') || ' '
         || coalesce(v_alignment, '') || ' '
         || coalesce(v_special, '')   || ' '
         || coalesce(v_color, '')     || ' '
         || coalesce(v_launch, '')    || ' '
         || coalesce(v_spin, '')      || ' '
         || coalesce(v_feel, '')      || ' '
         || coalesce(v_segments, '')  || ' '
         || coalesce(v_features, '')  || ' '
         || coalesce(v_notes, '')
       ), 'C')
  WHERE id = p_id;
END;
$$;

-- ─── ball_versions BEFORE trigger ───────────────────────────────────────────
-- Fires on INSERT or when name/family_id changes. Reads all related tables
-- via LEFT JOIN so a fresh insert with no specs yet still produces a partial vector
-- (specs/segments/features will rebuild it when their own rows are added).

CREATE OR REPLACE FUNCTION ball_versions_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_family_name   text;
  v_family_desc   text;
  v_brand_name    text;
  v_cover         text;
  v_core          text;
  v_dimple        text;
  v_notes         text;
  v_launch        text;
  v_spin          text;
  v_feel          text;
  v_logo_text     text;
  v_alignment     text;
  v_special       text;
  v_color         text;
  v_segments      text;
  v_features      text;
BEGIN
  SELECT f.name, f.description, b.name
  INTO v_family_name, v_family_desc, v_brand_name
  FROM ball_families f
  JOIN brands b ON b.id = f.brand_id
  WHERE f.id = NEW.family_id;

  SELECT ts.cover_material,
         ts.core_material,
         ts.dimple_pattern,
         ts.notes,
         ts.launch_profile::text,
         ts.spin_profile::text,
         ts.feel_profile::text
  INTO v_cover, v_core, v_dimple, v_notes, v_launch, v_spin, v_feel
  FROM technical_specs ts
  WHERE ts.version_id = NEW.id;

  SELECT vs.logo_text,
         vs.alignment_marking,
         vs.special_markings,
         vs.primary_color
  INTO v_logo_text, v_alignment, v_special, v_color
  FROM visual_signatures vs
  WHERE vs.version_id = NEW.id;

  SELECT string_agg(DISTINCT s.name, ' ')
  INTO v_segments
  FROM version_segments vseg
  JOIN segments s ON s.id = vseg.segment_id
  WHERE vseg.version_id = NEW.id;

  SELECT string_agg(DISTINCT idf.feature_value, ' ')
  INTO v_features
  FROM identification_features idf
  WHERE idf.version_id = NEW.id AND idf.importance_score >= 7;

  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A')
    || setweight(to_tsvector('english',
         coalesce(v_brand_name, '') || ' ' || coalesce(v_family_name, '')), 'B')
    || setweight(to_tsvector('english',
         coalesce(v_family_desc, '')  || ' '
         || coalesce(v_cover, '')     || ' '
         || coalesce(v_core, '')      || ' '
         || coalesce(v_dimple, '')    || ' '
         || coalesce(v_logo_text, '') || ' '
         || coalesce(v_alignment, '') || ' '
         || coalesce(v_special, '')   || ' '
         || coalesce(v_color, '')     || ' '
         || coalesce(v_launch, '')    || ' '
         || coalesce(v_spin, '')      || ' '
         || coalesce(v_feel, '')      || ' '
         || coalesce(v_segments, '')  || ' '
         || coalesce(v_features, '')  || ' '
         || coalesce(v_notes, '')
       ), 'C');
  RETURN NEW;
END;
$$;

-- ─── Propagation from ball_families ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION ball_families_propagate_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
BEGIN
  FOR v_id IN SELECT id FROM ball_versions WHERE family_id = NEW.id LOOP
    PERFORM rebuild_ball_version_search_vector(v_id);
  END LOOP;
  RETURN NEW;
END;
$$;

-- ─── Propagation from brands ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION brands_propagate_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
BEGIN
  FOR v_id IN
    SELECT v.id
    FROM ball_versions v
    JOIN ball_families f ON f.id = v.family_id
    WHERE f.brand_id = NEW.id
  LOOP
    PERFORM rebuild_ball_version_search_vector(v_id);
  END LOOP;
  RETURN NEW;
END;
$$;

-- ─── technical_specs trigger ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION technical_specs_update_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM rebuild_ball_version_search_vector(NEW.version_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trig_technical_specs_search_vector
AFTER INSERT OR UPDATE ON technical_specs
FOR EACH ROW EXECUTE FUNCTION technical_specs_update_search_vector();

-- ─── visual_signatures trigger ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION visual_signatures_update_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM rebuild_ball_version_search_vector(NEW.version_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trig_visual_signatures_search_vector
AFTER INSERT OR UPDATE ON visual_signatures
FOR EACH ROW EXECUTE FUNCTION visual_signatures_update_search_vector();

-- ─── version_segments trigger (INSERT + DELETE) ──────────────────────────────

CREATE OR REPLACE FUNCTION version_segments_update_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM rebuild_ball_version_search_vector(OLD.version_id);
  ELSE
    PERFORM rebuild_ball_version_search_vector(NEW.version_id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trig_version_segments_search_vector
AFTER INSERT OR DELETE ON version_segments
FOR EACH ROW EXECUTE FUNCTION version_segments_update_search_vector();

-- ─── identification_features trigger ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION identification_features_update_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM rebuild_ball_version_search_vector(OLD.version_id);
  ELSE
    PERFORM rebuild_ball_version_search_vector(NEW.version_id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trig_identification_features_search_vector
AFTER INSERT OR UPDATE OR DELETE ON identification_features
FOR EACH ROW EXECUTE FUNCTION identification_features_update_search_vector();

-- ─── Backfill all existing rows ──────────────────────────────────────────────
-- Triggers the ball_versions BEFORE trigger via name = name, which now JOINs
-- all related tables. Rows with no specs/segments get a partial vector that
-- will be enriched when that data is added later.

UPDATE ball_versions SET name = name;
