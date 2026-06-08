# ADR-013: Asset Management Strategy

**Date:** 2026-06-10  
**Status:** Accepted  
**Phase:** 6 — Platform Generalization & Asset Strategy

---

## Context

BallAtlas manages visual assets across two existing systems:

1. **`brands.logo_url`** — a single text column on the `brands` table storing either a
   Storage path or an external URL. No metadata, no lifecycle, no format differentiation.
2. **`images` table** — many-to-one with `ball_versions`. Stores product images with
   review status, quality scoring, attribution, and license metadata (Phase 4).

As the platform grows, the asset needs are expanding:

- Brand logos need SVG-first support for crisp display at all sizes
- Brand assets require the same provenance, attribution, and lifecycle controls
  as ball images (ADR-010)
- Future categories (equipment renders, 3D models, AI reference images) require
  a model that can extend without schema changes to existing tables
- The single `logo_url` column provides no ability to manage multiple logo variants,
  track approval state, or record licensing

This ADR defines a unified asset strategy that addresses these needs while preserving
full backward compatibility with the existing `images` table and `logo_url` column.

---

## Decision

### Asset categories

Four asset categories are defined:

| Category              | Examples                                                           | Primary use                                  |
| --------------------- | ------------------------------------------------------------------ | -------------------------------------------- |
| Brand assets          | SVG logos, PNG logos, brand marks, color palettes                  | Brand pages, API consumers, comparison views |
| Product assets        | Hero images, packaging shots, marketing images                     | Ball detail pages, search results            |
| Identification assets | Logo closeups, alignment markings, dimple imagery, number markings | Phase 6 image ID, similarity scoring         |
| Future assets         | 3D models, CAD previews, equipment renders, AI training references | Phase 8 AI layer                             |

**Product assets and identification assets are already managed** by the `images` table
(Phase 4). This ADR introduces first-class management for **brand assets**, with the
architecture designed to accommodate future asset categories without revisiting this decision.

### Brand assets table

A dedicated `brand_assets` table is introduced (not an extension of `images`):

**Rationale for a separate table:**

- Brand assets are scoped to `brands`, not `ball_versions`
- Mixing brand and ball assets in one table creates a NULL-heavy union table
- Brand asset types (`logo_svg`, `logo_png`, `brand_mark`) have no meaning in the
  ball `image_type` enum context
- Separation makes queries and admin UI simpler

**Schema:**

```sql
CREATE TABLE brand_assets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id          uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  asset_type        brand_asset_type NOT NULL,
  storage_path      text NOT NULL,
  mime_type         text NOT NULL,
  file_size_bytes   integer,
  source_url        text,
  attribution       text,
  license           text,
  alt_text          text,
  review_status     asset_review_status NOT NULL DEFAULT 'uploaded',
  quality_score     integer CHECK (quality_score BETWEEN 1 AND 10),
  uploaded_at       timestamptz NOT NULL DEFAULT now(),
  reviewed_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

**Asset type enum:**

```sql
CREATE TYPE brand_asset_type AS ENUM (
  'logo_svg',
  'logo_png',
  'brand_mark',
  'hero_image',
  'packaging',
  'identification_reference'
);
```

**Review status enum:**

```sql
CREATE TYPE asset_review_status AS ENUM (
  'uploaded',
  'pending_review',
  'approved',
  'archived'
);
```

### Brand identity columns

Two optional columns are added to `brands` for color identity metadata:

```sql
ALTER TABLE brands
  ADD COLUMN primary_color text,
  ADD COLUMN secondary_color text;
```

These store CSS hex values or named colors (e.g., `#e31837`). They are editorial data,
not generated from images. They serve UI theming, API consumers, and future comparison views.

### Asset metadata requirements

Every brand asset must support:

| Field           | Required | Notes                                                                                    |
| --------------- | -------- | ---------------------------------------------------------------------------------------- |
| `asset_type`    | Yes      | Enum: logo_svg, logo_png, brand_mark, hero_image, packaging, identification_reference    |
| `storage_path`  | Yes      | Supabase Storage path in `brand-assets` bucket                                           |
| `mime_type`     | Yes      | Must match actual file type (SVG: `image/svg+xml`)                                       |
| `source_url`    | Optional | Original URL if sourced externally                                                       |
| `attribution`   | Optional | Required when license is Creative Commons                                                |
| `license`       | Optional | `ballatlas-original`, `manufacturer-provided`, `cc-by`, `cc-by-sa`, `fair-use-reference` |
| `review_status` | Yes      | Default: `uploaded`                                                                      |
| `quality_score` | Optional | 1–10 editorial judgment                                                                  |

### Asset lifecycle

```
uploaded → pending_review → approved
                          ↘ archived

approved → archived
```

| Status           | Meaning                         | Visibility       |
| ---------------- | ------------------------------- | ---------------- |
| `uploaded`       | File received, not yet reviewed | Admin only       |
| `pending_review` | Queued for editorial review     | Admin only       |
| `approved`       | Reviewed and ready for use      | Public (via RLS) |
| `archived`       | Superseded or retired           | Admin only       |

Only `approved` assets are returned by public queries (enforced by RLS).

### SVG-first brand logos

Brand pages prefer SVG over PNG when rendering logos:

```
1. Query brand_assets WHERE brand_id = ? AND asset_type = 'logo_svg' AND review_status = 'approved'
2. Fall back to asset_type = 'logo_png' if no SVG exists
3. Fall back to brands.logo_url if no managed brand assets exist
```

This three-level fallback preserves backward compatibility with all brands that only
have a `logo_url` entry from Phase 1.

### SVG safety validation

All uploaded SVG files are validated server-side before storage:

- Max file size: 512 KB
- MIME type must be `image/svg+xml`
- No `<script>` elements
- No event handler attributes (`on*`)
- No `javascript:` URI schemes in `href` or `src`
- No external `<use>` references (e.g. `<use href="https://...">`)
- No `<foreignObject>` elements

Validation runs in a `validateSvgSafety()` function in `packages/validators/src/assets.ts`.

### Storage bucket

A new `brand-assets` public-read Supabase Storage bucket is created for brand assets.
Public read allows direct URL rendering without signed URLs.

### Abstraction layer

`packages/golf-data/src/assets/` defines TypeScript interfaces for the asset domain:

- `AssetProvider` — future automated asset acquisition (same pattern as `ImageProvider`)
- `AssetMetadata` — canonical metadata shape shared across asset categories
- `AssetReference` — lightweight pointer (id + url + type) for rendering
- `AssetValidationResult` — discriminated union for validation outcomes

These interfaces are design-only in Phase 6. No implementations.

---

## Consequences

### Positive

- SVG logos render crisply at all sizes — brand pages look premium immediately
- Brand assets have the same provenance, review, and licensing controls as ball images
- The `logo_url` column is preserved — zero breaking changes to existing code
- Abstraction layer enables future automated brand asset acquisition (Phase 7+)
- Brand identity colors enable future UI theming and API consumer features

### Negative

- Admin workflow requires two separate sections (Brand edit for `logo_url`, Brand Assets for managed assets)
- Three-level logo fallback adds a DB query per brand detail page load
- Quality scores and review status require editorial discipline to maintain

### Not in scope

- Automated SVG optimization (SVGO) — could be added to the upload pipeline later
- AI-generated brand assets — explicitly excluded (ADR-010 principle)
- 3D models and CAD files — reserved as `future_assets` category for Phase 8+

---

## References

- ADR-004: Database Schema Hierarchy — `brands` table
- ADR-010: Data Acquisition Strategy — asset attribution and licensing principles
- `docs/assets/README.md` — implementation reference
- `packages/golf-data/src/assets/` — abstraction layer
- `packages/validators/src/assets.ts` — SVG safety validation
