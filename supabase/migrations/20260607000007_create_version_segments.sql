-- Migration: version_segments junction table
-- Many-to-many: a version can belong to multiple segments.
-- A Tour Premium ball that also emphasizes Soft Feel gets both tags.

CREATE TABLE version_segments (
  version_id  uuid NOT NULL REFERENCES ball_versions(id) ON DELETE CASCADE,
  segment_id  uuid NOT NULL REFERENCES segments(id)      ON DELETE RESTRICT,
  PRIMARY KEY (version_id, segment_id)
);

CREATE INDEX version_segments_segment_id_idx ON version_segments (segment_id);

COMMENT ON TABLE version_segments IS 'Many-to-many junction: ball_versions ↔ segments.';
