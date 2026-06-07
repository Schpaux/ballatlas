# BallAtlas Database Schema

> Generated from migrations in `supabase/migrations/`. Regenerate TypeScript types
> with `pnpm supabase:types` after any schema change.

---

## Entity Relationship Overview

```
brands (1) ─── (N) ball_families (1) ─── (N) ball_versions
                                                   │
                         ┌─────────────────────────┤
                         │                         │
                  technical_specs (1:1)    visual_signatures (1:1)
                  identification_features (N)       │
                  images (N)               version_segments (N) ─── segments
                  price_observations (N) ─── sources
```

---

## Tables

### brands

Top-level manufacturer registry.

| Column     | Type        | Notes                        |
| ---------- | ----------- | ---------------------------- |
| id         | uuid PK     | gen_random_uuid()            |
| name       | text NN     | Display name                 |
| slug       | text UNIQUE | URL identifier               |
| country    | text        | ISO 2-letter code            |
| website    | text        | Official website URL         |
| logo_url   | text        | Storage path or external URL |
| created_at | timestamptz |                              |
| updated_at | timestamptz | Auto-updated by trigger      |

FTS: `search_vector` GIN index on `name`.

---

### ball_families

Named model lines under a brand.

| Column             | Type        | Notes                          |
| ------------------ | ----------- | ------------------------------ |
| id                 | uuid PK     |                                |
| brand_id           | uuid FK     | → brands.id                    |
| name               | text NN     | e.g. "Pro V1"                  |
| slug               | text        | Unique within brand            |
| description        | text        |                                |
| first_release_year | int         | 1900–2100                      |
| last_release_year  | int         | NULL if still active           |
| status             | ball_status | draft/published/archived/disc. |
| created_at         | timestamptz |                                |
| updated_at         | timestamptz |                                |

Unique constraint: `(brand_id, slug)`.

---

### ball_versions

Individual year/generation releases. The primary entity in the registry.

| Column       | Type        | Notes                             |
| ------------ | ----------- | --------------------------------- |
| id           | uuid PK     |                                   |
| family_id    | uuid FK     | → ball_families.id                |
| name         | text NN     | e.g. "Pro V1 2025"                |
| slug         | text UNIQUE | Global: `{brand}-{family}-{year}` |
| release_year | int         |                                   |
| release_date | date        | Exact launch date if known        |
| msrp_usd     | numeric     | Per dozen at launch               |
| msrp_nok     | numeric     | Per dozen at launch (NOK)         |
| status       | ball_status |                                   |
| created_at   | timestamptz |                                   |
| updated_at   | timestamptz |                                   |

FTS: `search_vector` GIN index on `name` (weight A).

---

### technical_specs

One-to-one with `ball_versions`. Structured specification data.

| Column              | Type           | Notes                          |
| ------------------- | -------------- | ------------------------------ |
| version_id          | uuid UNIQUE FK | → ball_versions.id             |
| construction_layers | int            | 1–7                            |
| compression         | int            | 1–120. Lower = softer.         |
| cover_material      | text           | e.g. Urethane, Surlyn          |
| core_material       | text           |                                |
| dimple_count        | int            | 100–600                        |
| dimple_pattern      | text           |                                |
| launch_profile      | launch_profile | low/mid/high                   |
| spin_profile        | spin_profile   | low/mid/high                   |
| feel_profile        | feel_profile   | soft/medium/firm               |
| notes               | text           | Overflow for non-modelled data |

---

### visual_signatures

One-to-one with `ball_versions`. Primary Phase 5 AI asset.

| Column            | Type        | Notes                          |
| ----------------- | ----------- | ------------------------------ |
| version_id        | uuid UNIQUE | → ball_versions.id             |
| primary_color     | text        | white/yellow/orange/pink/...   |
| finish            | ball_finish | glossy/matte/satin             |
| logo_style        | text        | e.g. "Titleist cursive script" |
| logo_text         | text        | Exact text on ball             |
| alignment_marking | text        | e.g. "Triple Track"            |
| number_style      | text        |                                |
| number_color      | text        |                                |
| special_markings  | text        |                                |

---

### identification_features

Many-to-one with `ball_versions`. Typed key-value feature registry.

| Column           | Type                        | Notes                        |
| ---------------- | --------------------------- | ---------------------------- |
| version_id       | uuid FK                     | → ball_versions.id           |
| feature_type     | identification_feature_type | See enum below               |
| feature_value    | text                        | e.g. "Triple Track"          |
| importance_score | int 1–10                    | Higher = more discriminating |

Importance scores from research:

- brand_text / model_text: 10
- logo / alignment_marking / color: 9–8
- finish / dimple_pattern: 7–5
- number_color: 3

---

### segments

Static reference table. Market classification.

| Slug         | Name         |
| ------------ | ------------ |
| tour-premium | Tour Premium |
| performance  | Performance  |
| distance     | Distance     |
| soft-feel    | Soft Feel    |
| value        | Value        |
| lake-ball    | Lake Ball    |

---

### version_segments

Many-to-many junction between `ball_versions` and `segments`.

---

### images

Many-to-one with `ball_versions`. Supports 7 image types:
`hero`, `logo`, `alignment`, `number`, `side`, `dimple`, `packaging`.

Images stored in Supabase Storage bucket `ball-images` (public).

---

### sources

Data provenance registry. `reliability_score` 1–10.

---

### price_observations

Append-only time-series pricing. Never update rows; insert new observations.

Supported conditions: `new`, `mint`, `near_mint`, `good`, `fair`, `recycled`, `lake_ball`.

---

## Enums

| Enum                        | Values                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| ball_status                 | draft, published, archived, discontinued                                                                      |
| ball_finish                 | glossy, matte, satin                                                                                          |
| launch_profile              | low, mid, high                                                                                                |
| spin_profile                | low, mid, high                                                                                                |
| feel_profile                | soft, medium, firm                                                                                            |
| image_type                  | hero, logo, alignment, number, side, dimple, packaging                                                        |
| price_condition             | new, mint, near_mint, good, fair, recycled, lake_ball                                                         |
| source_type                 | manufacturer, retailer, review, community, auction                                                            |
| identification_feature_type | brand_text, model_text, logo, alignment_marking, number_color, finish, color, dimple_pattern, special_marking |

---

_See `docs/decisions/ADR-004-database-schema-hierarchy.md` for design rationale._
