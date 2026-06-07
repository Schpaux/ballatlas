-- Migration: images table
-- Many-to-one with ball_versions. Each version can have multiple images
-- of different types (hero, logo close-up, alignment marking, etc.).
-- Images are stored in Supabase Storage bucket 'ball-images'.

CREATE TABLE images (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id    uuid        NOT NULL REFERENCES ball_versions(id) ON DELETE CASCADE,
  image_type    image_type  NOT NULL,
  -- Supabase Storage object path, e.g. 'titleist-pro-v1-2025/hero.jpg'
  storage_path  text,
  -- Source URL for external images (before upload to Storage)
  source_url    text,
  license       text,
  width         int         CHECK (width  > 0),
  height        int         CHECK (height > 0),
  created_at    timestamptz NOT NULL DEFAULT now(),

  -- At least one of storage_path or source_url must be present
  CHECK (storage_path IS NOT NULL OR source_url IS NOT NULL)
);

CREATE INDEX images_version_id_idx  ON images (version_id);
CREATE INDEX images_image_type_idx  ON images (image_type);

COMMENT ON TABLE  images              IS 'Ball images. Multiple per version, typed by angle/purpose.';
COMMENT ON COLUMN images.storage_path IS 'Path within Supabase Storage ball-images bucket.';
COMMENT ON COLUMN images.source_url   IS 'Original source URL (external). Used before uploading to Storage.';
COMMENT ON COLUMN images.license      IS 'License terms, e.g. CC BY 4.0, manufacturer-provided, proprietary.';
