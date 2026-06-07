# Import Pipeline

> See `packages/golfball-data/` for source files and scripts.  
> See `docs/decisions/ADR-006-import-pipeline.md` for design rationale.

---

## Commands

```bash
# Validate raw data — no DB writes
pnpm validate:balls

# Full import to local Supabase
pnpm import:balls

# Dry run — validate + normalize, no DB writes
pnpm import:balls --dry-run
```

---

## Prerequisites

1. Local Supabase running: `supabase start`
2. Migrations applied: `supabase db push --local`
3. Environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
   ```

---

## Pipeline Stages

```
1. LOAD       Read raw/brands.json, raw/families.json, raw/versions.json
2. VALIDATE   Zod schemas from @ballatlas/validators (RawBrandsFileSchema, etc.)
3. NORMALIZE  Resolve brand_slug → brand_id, family_slug → family_id
4. UPSERT     Insert or update via service role key (bypasses RLS)
              brands:     onConflict='slug'
              families:   onConflict='brand_id,slug'
              versions:   onConflict='slug'
5. RELATIONS  Upsert technical_specs, visual_signatures; replace identification_features;
              resolve + upsert version_segments
6. REPORT     Print inserted/failed counts per entity type
```

---

## Raw Data Format

### raw/brands.json

```json
[
  {
    "name": "Titleist",
    "slug": "titleist",
    "country": "US",
    "website": "https://www.titleist.com"
  }
]
```

### raw/families.json

```json
[
  {
    "brand_slug": "titleist",
    "name": "Pro V1",
    "slug": "pro-v1",
    "description": "...",
    "first_release_year": 2000,
    "status": "published"
  }
]
```

### raw/versions.json

```json
[
  {
    "brand_slug": "titleist",
    "family_slug": "pro-v1",
    "name": "Pro V1 2025",
    "slug": "titleist-pro-v1-2025",
    "release_year": 2025,
    "msrp_usd": 54.99,
    "msrp_nok": 599,
    "status": "published",
    "specs": {
      "construction_layers": 3,
      "compression": 87,
      "cover_material": "Urethane",
      "dimple_count": 388,
      "launch_profile": "mid",
      "spin_profile": "high",
      "feel_profile": "soft"
    },
    "visual": {
      "primary_color": "white",
      "finish": "glossy",
      "logo_style": "Titleist script",
      "logo_text": "Titleist",
      "alignment_marking": "Single line"
    },
    "features": [
      { "feature_type": "brand_text", "feature_value": "Titleist", "importance_score": 10 },
      { "feature_type": "model_text", "feature_value": "Pro V1", "importance_score": 10 },
      { "feature_type": "logo", "feature_value": "Titleist cursive script", "importance_score": 9 }
    ],
    "segments": ["tour-premium"]
  }
]
```

---

## Idempotency

The pipeline is safe to re-run. All operations use `upsert` with slug-based
conflict keys. Re-running updates existing records and skips unchanged ones.

Identification features are the exception — they are deleted and re-inserted
on each run to ensure the feature list stays exactly in sync with the JSON.

---

## Adding New Data

1. Edit the relevant JSON file in `packages/golfball-data/raw/`
2. Run `pnpm validate:balls` to verify
3. Run `pnpm import:balls` to import

---

## Current Seed Dataset

| Entity   | Count |
| -------- | ----- |
| Brands   | 20    |
| Families | 53    |
| Versions | ~75   |

Target at full seed: 250–300 versions. The schema and pipeline support arbitrary
expansion — add records to `raw/versions.json` and re-run `pnpm import:balls`.
