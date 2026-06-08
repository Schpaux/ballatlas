# Phase 6 — Platform Generalization & Asset Strategy

**Status:** Complete  
**Date:** 2026-06-10

---

## Objective

Future-proof the BallAtlas architecture for eventual platform expansion without
rewriting any working golf ball code. Introduce SVG-first brand asset management.

---

## Deliverables

### Workstream 0 — Architectural Review

- [x] `docs/platform/generalization-review.md` — five-question review of the current model

### Workstream 1 — Asset Strategy

- [x] `docs/decisions/ADR-013-asset-management-strategy.md` — Accepted

### Workstream 2 — SVG Support

- [x] Migration: `brand_asset_type` and `asset_review_status` enums
- [x] Migration: `brand_assets` table with RLS, index, and updated_at trigger
- [x] Migration: `primary_color` / `secondary_color` columns on `brands`
- [x] Migration: `brand-assets` public Supabase Storage bucket
- [x] `packages/validators/src/assets.ts` — `validateSvgSafety()`, `BrandAssetMetaSchema`, `BrandIdentitySchema`
- [x] `packages/database/src/types.generated.ts` — updated with new table + enums
- [x] `packages/validators/src/ball.ts` — `BrandSchema` extended with color identity fields
- [x] `/brands/[slug]/page.tsx` — SVG-first logo resolution with three-level fallback chain

### Workstream 3 — Brand Asset Management

- [x] `/admin/brand-assets` — upload, review, approve, archive, delete brand assets
- [x] SVG safety validation in upload Server Action
- [x] Brand filter + status tabs (uploaded / pending_review / approved / archived)
- [x] `/admin/brands/[id]/edit` — extended with identity colors + Brand Assets link
- [x] Admin nav updated with Brand Assets link

### Workstream 4 — Generalized Product Model Review

- [x] `docs/decisions/ADR-014-product-domain-generalization.md` — Proposed (not Accepted)

### Workstream 5 — Future Equipment Strategy

- [x] `docs/platform/future-equipment-strategy.md` — analysis for 8 equipment categories

### Workstream 6 — Asset Abstraction Layer

- [x] `packages/golf-data/src/assets/types.ts` — `AssetMetadata`, `AssetReference`, `AssetValidationResult`, `AssetProvider`, `AssetCandidate`
- [x] `packages/golf-data/src/assets/index.ts` — barrel export
- [x] `packages/golf-data/src/index.ts` — assets module exported

### Workstream 7 — Registry Compatibility Audit

- [x] `docs/platform/compatibility-audit.md` — zero regressions confirmed

### Documentation

- [x] `docs/assets/README.md` — asset architecture reference
- [x] `CLAUDE.md` — Phase 6 conventions added
- [x] `ARCHITECTURE.md` — brand assets, storage bucket, package exports updated
- [x] `ROADMAP.md` — Phase 6 marked complete; Phase 7 renumbered

---

## Key Decisions

| Decision                                            | Outcome                                                                      |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| Separate `brand_assets` table vs extending `images` | Separate — different FK (brands vs ball_versions), different type vocabulary |
| Rename Brand/Family/Version hierarchy               | Not renamed — names are correct and universally understood                   |
| SVG safety validation approach                      | Server-side regex on raw SVG content before upload                           |
| Logo fallback chain                                 | SVG → PNG → `logo_url` — backward compatible, no data migration needed       |
| ADR-014 status                                      | Proposed, not Accepted — no implementation until category decision is made   |

---

## Files Changed

| Path                                                                | Change                 |
| ------------------------------------------------------------------- | ---------------------- |
| `supabase/migrations/20260610000001_create_brand_asset_enums.sql`   | New                    |
| `supabase/migrations/20260610000002_create_brand_assets.sql`        | New                    |
| `supabase/migrations/20260610000003_add_brand_identity_columns.sql` | New                    |
| `supabase/migrations/20260610000004_create_brand_assets_bucket.sql` | New                    |
| `packages/golf-data/src/assets/types.ts`                            | New                    |
| `packages/golf-data/src/assets/index.ts`                            | New                    |
| `packages/golf-data/src/index.ts`                                   | Extended               |
| `packages/validators/src/assets.ts`                                 | New                    |
| `packages/validators/src/ball.ts`                                   | Extended (BrandSchema) |
| `packages/validators/src/index.ts`                                  | Extended               |
| `packages/database/src/types.generated.ts`                          | Extended               |
| `apps/web/app/(admin)/admin/brand-assets/page.tsx`                  | New                    |
| `apps/web/app/(admin)/admin/brands/[id]/edit/page.tsx`              | Extended               |
| `apps/web/app/(admin)/admin/layout.tsx`                             | Extended               |
| `apps/web/app/brands/[slug]/page.tsx`                               | Extended               |
| `docs/platform/generalization-review.md`                            | New                    |
| `docs/platform/future-equipment-strategy.md`                        | New                    |
| `docs/platform/compatibility-audit.md`                              | New                    |
| `docs/assets/README.md`                                             | New                    |
| `docs/decisions/ADR-013-asset-management-strategy.md`               | New                    |
| `docs/decisions/ADR-014-product-domain-generalization.md`           | New                    |
| `docs/status/phase-6.md`                                            | New                    |
| `CLAUDE.md`                                                         | Updated                |
| `ARCHITECTURE.md`                                                   | Updated                |
| `ROADMAP.md`                                                        | Updated                |
