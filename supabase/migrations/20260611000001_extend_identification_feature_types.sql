-- Migration: Extend identification_feature_type enum
-- Phase 7 adds three new identifiable feature categories:
--   play_number   — the printed play number (1–8), useful when color is distinctive
--   number_style  — typography style of the number (bold, outline, standard, script)
--   visual_pattern — distinctive surface patterns (Truvis hexagonal, camo, marble, etc.)
--
-- These values are appended; existing rows are unaffected.

ALTER TYPE identification_feature_type ADD VALUE IF NOT EXISTS 'play_number';
ALTER TYPE identification_feature_type ADD VALUE IF NOT EXISTS 'number_style';
ALTER TYPE identification_feature_type ADD VALUE IF NOT EXISTS 'visual_pattern';
