-- Migration: Enums and shared utility functions
-- All PostgreSQL enum types used across the schema.
-- Defined first so subsequent migrations can reference them.

-- Ball lifecycle status
CREATE TYPE ball_status AS ENUM (
  'draft',
  'published',
  'archived',
  'discontinued'
);

-- Physical finish of the ball cover
CREATE TYPE ball_finish AS ENUM (
  'glossy',
  'matte',
  'satin'
);

-- Ball trajectory category (used in technical_specs)
CREATE TYPE launch_profile AS ENUM ('low', 'mid', 'high');
CREATE TYPE spin_profile   AS ENUM ('low', 'mid', 'high');
CREATE TYPE feel_profile   AS ENUM ('soft', 'medium', 'firm');

-- Image angle/type taxonomy
CREATE TYPE image_type AS ENUM (
  'hero',
  'logo',
  'alignment',
  'number',
  'side',
  'dimple',
  'packaging'
);

-- Used/resale condition for price observations
CREATE TYPE price_condition AS ENUM (
  'new',
  'mint',
  'near_mint',
  'good',
  'fair',
  'recycled',
  'lake_ball'
);

-- Source reliability taxonomy
CREATE TYPE source_type AS ENUM (
  'manufacturer',
  'retailer',
  'review',
  'community',
  'auction'
);

-- Identification feature types (structured for Phase 5 AI)
CREATE TYPE identification_feature_type AS ENUM (
  'brand_text',
  'model_text',
  'logo',
  'alignment_marking',
  'number_color',
  'finish',
  'color',
  'dimple_pattern',
  'special_marking'
);

-- Shared trigger function: auto-update updated_at on every row change.
-- Applied to every table that has an updated_at column.
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
