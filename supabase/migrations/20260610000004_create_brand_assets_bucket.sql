-- Phase 6: brand-assets storage bucket
-- Public read access — approved brand logos are served directly by URL.

INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read from brand-assets bucket
CREATE POLICY "Public read brand assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-assets');

-- Allow service role to manage brand assets
CREATE POLICY "Service role manages brand assets"
  ON storage.objects FOR ALL
  USING (bucket_id = 'brand-assets')
  WITH CHECK (bucket_id = 'brand-assets');
