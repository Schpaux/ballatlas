-- Migration 017: Extend images table for Phase 4 image acquisition workflow
-- Adds: review_status (pending/approved/rejected), image_quality_score (1–10), attribution text

-- Review status enum
CREATE TYPE image_review_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE images
  ADD COLUMN review_status   image_review_status NOT NULL DEFAULT 'pending',
  ADD COLUMN image_quality_score int CHECK (image_quality_score BETWEEN 1 AND 10),
  ADD COLUMN attribution     text,
  ADD COLUMN alt_text        text,
  ADD COLUMN reviewed_at     timestamptz,
  ADD COLUMN reviewed_by     text;

-- Index for review queue (pending images sorted by upload date)
CREATE INDEX images_review_status_idx ON images (review_status, created_at DESC);

-- Only approved images are publicly visible
-- The existing RLS policy allows public read of all images; we refine it here.
-- Drop the old permissive policy and replace with approved-only public read.
DROP POLICY IF EXISTS "Public can read images" ON images;

CREATE POLICY "Public can read approved images"
  ON images FOR SELECT
  USING (review_status = 'approved');

CREATE POLICY "Service role full access for images"
  ON images FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON COLUMN images.review_status       IS 'Editorial review state. Only approved images appear publicly.';
COMMENT ON COLUMN images.image_quality_score IS '1–10 editorial quality score. 7+ required for AI training data.';
COMMENT ON COLUMN images.attribution         IS 'Attribution text for CC or third-party images.';
COMMENT ON COLUMN images.alt_text            IS 'Descriptive alt text for accessibility and SEO.';
COMMENT ON COLUMN images.reviewed_at         IS 'When this image was approved or rejected.';
COMMENT ON COLUMN images.reviewed_by         IS 'Who reviewed this image (admin user identifier).';
