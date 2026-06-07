-- Migration: identification_features table
-- Many-to-one with ball_versions. Stores individual discriminating features
-- as typed key-value pairs with an importance score.
--
-- This table is the primary asset for Phase 5 computer vision:
-- each row represents one detectable feature of a ball.
-- importance_score (1–10) encodes how uniquely identifying the feature is.
-- Per research: brand_text=10, model_text=10, logo=9, alignment_marking=9,
--               color=8, finish=6, dimple_pattern=5, number_color=3.

CREATE TABLE identification_features (
  id               uuid                         PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id       uuid                         NOT NULL REFERENCES ball_versions(id) ON DELETE CASCADE,
  feature_type     identification_feature_type  NOT NULL,
  feature_value    text                         NOT NULL,
  importance_score int                          NOT NULL CHECK (importance_score BETWEEN 1 AND 10),
  created_at       timestamptz                  NOT NULL DEFAULT now()
);

CREATE INDEX identification_features_version_id_idx    ON identification_features (version_id);
CREATE INDEX identification_features_feature_type_idx  ON identification_features (feature_type);
CREATE INDEX identification_features_importance_idx    ON identification_features (importance_score DESC);

COMMENT ON TABLE  identification_features                  IS 'Typed identification features per version. Primary Phase 5 AI asset.';
COMMENT ON COLUMN identification_features.feature_type    IS 'Category of the feature (brand_text, logo, alignment_marking, etc.).';
COMMENT ON COLUMN identification_features.feature_value   IS 'Exact value, e.g. "Triple Track", "Titleist script", "red".';
COMMENT ON COLUMN identification_features.importance_score IS '1–10 scale. Higher = more uniquely identifying. brand_text/model_text = 10.';
