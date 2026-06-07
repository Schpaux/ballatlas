-- Migration: Supabase Storage buckets
-- Defines the three storage buckets used by BallAtlas.
-- Uses the storage schema's insert function (Supabase managed).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- Public bucket: official product images served by CDN
  (
    'ball-images',
    'ball-images',
    true,
    5242880,  -- 5 MB per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  -- Private bucket: user-uploaded identification images (Phase 5)
  (
    'identification',
    'identification',
    false,
    10485760,  -- 10 MB per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  ),
  -- Private bucket: admin-only uploads (logos, press kits)
  (
    'admin-assets',
    'admin-assets',
    false,
    20971520,  -- 20 MB per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
  )
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: allow public read on ball-images
CREATE POLICY "ball_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ball-images');

-- Storage RLS: service role manages uploads (admin and import pipeline)
-- No INSERT/UPDATE/DELETE policies for anon — service role bypasses RLS
