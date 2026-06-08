-- Phase 6: Brand asset type and review status enums

CREATE TYPE brand_asset_type AS ENUM (
  'logo_svg',
  'logo_png',
  'brand_mark',
  'hero_image',
  'packaging',
  'identification_reference'
);

CREATE TYPE asset_review_status AS ENUM (
  'uploaded',
  'pending_review',
  'approved',
  'archived'
);
