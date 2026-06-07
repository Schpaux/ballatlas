-- Migration: visual_signatures table
-- One-to-one with ball_versions. Structured visual data for Phase 5 AI.
-- Every field is a discrete visual attribute that a computer vision model
-- or OCR pipeline can extract and compare.

CREATE TABLE visual_signatures (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id        uuid        NOT NULL UNIQUE REFERENCES ball_versions(id) ON DELETE CASCADE,
  -- Color and finish
  primary_color     text,       -- e.g. 'white', 'yellow', 'orange', 'pink'
  finish            ball_finish,
  -- Logo attributes
  logo_style        text,       -- e.g. 'Titleist script', 'Callaway V', 'Bridgestone B'
  logo_text         text,       -- Exact text printed on ball, e.g. 'Titleist', 'CALLAWAY'
  -- Marking attributes
  alignment_marking text,       -- e.g. 'Triple Track', 'single line', 'arrow', 'none'
  number_style      text,       -- e.g. 'standard', 'bold', 'outline'
  number_color      text,       -- e.g. 'black', 'red', 'gold', 'white'
  special_markings  text,       -- e.g. 'Truvis pattern', 'hexagonal print', 'custom'
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER visual_signatures_updated_at
  BEFORE UPDATE ON visual_signatures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX visual_signatures_version_id_idx  ON visual_signatures (version_id);
CREATE INDEX visual_signatures_primary_color_idx ON visual_signatures (primary_color);
CREATE INDEX visual_signatures_finish_idx       ON visual_signatures (finish);

COMMENT ON TABLE  visual_signatures                  IS 'Structured visual attributes per version. Designed for Phase 5 AI identification.';
COMMENT ON COLUMN visual_signatures.primary_color    IS 'Dominant ball color. Key identifier — non-white balls are a strong signal.';
COMMENT ON COLUMN visual_signatures.alignment_marking IS 'Alignment aid (Triple Track, single line, etc.). Very high AI signal per research.';
COMMENT ON COLUMN visual_signatures.logo_style       IS 'Visual style of the brand logo (script, block, symbol). Very high AI signal.';
