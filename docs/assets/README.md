# BallAtlas Asset Architecture

> Implementation reference for the asset system introduced in Phase 6.
> See ADR-013 for the strategic rationale.

---

## Asset Categories

| Category                    | Table          | Bucket                     | Status   |
| --------------------------- | -------------- | -------------------------- | -------- |
| Brand assets (logos, marks) | `brand_assets` | `brand-assets` (public)    | Phase 6  |
| Ball product images         | `images`       | `ball-images` (public)     | Phase 4  |
| Identification uploads      | —              | `identification` (private) | Phase 6+ |
| Admin uploads               | —              | `admin-assets` (private)   | Phase 2  |

---

## Brand Assets

### Table: `brand_assets`

```
brand_assets
├── id               uuid PK
├── brand_id         uuid FK → brands.id
├── asset_type       brand_asset_type enum
├── storage_path     text (Supabase Storage path in brand-assets bucket)
├── mime_type        text
├── file_size_bytes  integer (optional)
├── source_url       text (optional — original external URL if sourced externally)
├── attribution      text (optional — required for Creative Commons)
├── license          text (optional)
├── alt_text         text (optional)
├── review_status    asset_review_status enum
├── quality_score    integer 1–10 (optional)
├── uploaded_at      timestamptz
├── reviewed_at      timestamptz (optional)
├── created_at       timestamptz
└── updated_at       timestamptz
```

### Enums

**`brand_asset_type`**

- `logo_svg` — SVG format brand logo (preferred for display)
- `logo_png` — PNG format brand logo (fallback)
- `brand_mark` — Abstract mark without text (icon only)
- `hero_image` — Brand hero / banner image
- `packaging` — Product packaging reference
- `identification_reference` — High-res reference for AI identification

**`asset_review_status`**

- `uploaded` — Received, not yet queued for review
- `pending_review` — In review queue
- `approved` — Ready for public display
- `archived` — Retired or superseded

---

## Logo Resolution Order

When displaying a brand logo, components resolve in this order:

```
1. brand_assets WHERE brand_id = ? AND asset_type = 'logo_svg' AND review_status = 'approved'
   → Use SVG URL from storage
2. brand_assets WHERE brand_id = ? AND asset_type = 'logo_png' AND review_status = 'approved'
   → Use PNG URL from storage
3. brands.logo_url
   → Use legacy URL (external URL or storage path)
4. No logo → render brand initials or placeholder
```

---

## SVG Upload Validation

SVG files are validated server-side in `packages/validators/src/assets.ts`:

| Check                             | Reason                                   |
| --------------------------------- | ---------------------------------------- |
| MIME type = `image/svg+xml`       | Prevent non-SVG uploads disguised as SVG |
| File size ≤ 512 KB                | Prevent excessively complex SVGs         |
| No `<script>` elements            | XSS prevention                           |
| No `on*` event handler attributes | XSS prevention                           |
| No `javascript:` URIs             | XSS prevention                           |
| No external `<use>` references    | Prevent SSRF via external SVG symbols    |
| No `<foreignObject>`              | Prevent HTML injection within SVG        |

---

## Storage Buckets

| Bucket           | Access      | Contents                                    |
| ---------------- | ----------- | ------------------------------------------- |
| `brand-assets`   | Public read | Approved brand logos, marks, and references |
| `ball-images`    | Public read | Approved ball product images                |
| `identification` | Private     | User identification uploads                 |
| `admin-assets`   | Private     | Internal admin uploads                      |

---

## Abstraction Layer

`packages/golf-data/src/assets/` defines framework-free interfaces:

```typescript
// Types and interfaces only — no implementations in Phase 6

AssetMetadata // Canonical metadata shape across all asset categories
AssetReference // Lightweight pointer for rendering (id + url + type + alt_text)
AssetValidationResult // { ok: true } | { ok: false; errors: string[] }
AssetProvider // Interface for future automated asset acquisition
```

---

## Admin

**`/admin/brand-assets`** — Upload, review, and manage brand assets:

- Upload SVG or PNG for a brand
- Edit metadata (attribution, license, alt text, quality score)
- Approve or archive assets
- Filter by brand, asset type, review status

Brand identity colors (`primary_color`, `secondary_color`) are edited on
the brand edit page at `/admin/brands/[id]/edit`.

---

_See ADR-013 for the strategic rationale. See `packages/golf-data/src/assets/` for interface definitions._
