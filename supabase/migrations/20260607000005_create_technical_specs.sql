-- Migration: technical_specs table
-- One-to-one with ball_versions. Contains all structured specification data.
-- Separate table (not columns on ball_versions) for clarity and to allow
-- partial specs (a version can exist before specs are fully researched).

CREATE TABLE technical_specs (
  id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id           uuid          NOT NULL UNIQUE REFERENCES ball_versions(id) ON DELETE CASCADE,
  -- Construction
  construction_layers  int           CHECK (construction_layers BETWEEN 1 AND 7),
  compression          int           CHECK (compression BETWEEN 1 AND 120),
  -- Materials
  cover_material       text,
  core_material        text,
  -- Dimple geometry
  dimple_count         int           CHECK (dimple_count BETWEEN 100 AND 600),
  dimple_pattern       text,
  -- Performance profile
  launch_profile       launch_profile,
  spin_profile         spin_profile,
  feel_profile         feel_profile,
  -- Free-text notes for additional specs not yet modelled
  notes                text,
  created_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at           timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER technical_specs_updated_at
  BEFORE UPDATE ON technical_specs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Filterable spec indexes
CREATE INDEX technical_specs_version_id_idx       ON technical_specs (version_id);
CREATE INDEX technical_specs_compression_idx      ON technical_specs (compression);
CREATE INDEX technical_specs_construction_layers_idx ON technical_specs (construction_layers);
CREATE INDEX technical_specs_cover_material_idx   ON technical_specs (cover_material);

COMMENT ON TABLE  technical_specs                   IS 'Structured technical specifications per ball version. One-to-one with ball_versions.';
COMMENT ON COLUMN technical_specs.compression       IS 'Compression rating (1–120). Lower = softer. e.g. Pro V1 ≈ 87, Pro V1x ≈ 97.';
COMMENT ON COLUMN technical_specs.dimple_count      IS 'Total number of dimples. e.g. Pro V1 = 388, Pro V1x = 348.';
COMMENT ON COLUMN technical_specs.cover_material    IS 'e.g. Urethane, Surlyn, Ionomer.';
COMMENT ON COLUMN technical_specs.notes             IS 'Overflow field for specs not yet structured as columns.';
