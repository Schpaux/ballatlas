# Phase 4 — Market Data, Image Acquisition & Data Governance Platform

**Started:** 2026-06-07
**Target Completion:** TBD
**Status:** 🟡 In Progress

---

## Pre-Implementation

- [x] All Phase 3 deliverables reviewed
- [x] ADR numbering conflict resolved (Phase 4 prompt used ADR-007/008 but those exist; created ADR-009/010)
- [x] `pnpm type-check` — zero errors before starting
- [x] `pnpm lint` — zero errors before starting

---

## Workstream 0 — Architecture Governance

- [x] ADR-009: Hosted Supabase Development Strategy (`docs/decisions/ADR-009-hosted-supabase-development.md`)
- [x] ADR-010: Data Acquisition Strategy (`docs/decisions/ADR-010-data-acquisition-strategy.md`)

---

## Workstream 1 — Image Acquisition System

### Schema

- [x] Migration 017: `images` table extended
  - `review_status` enum (`pending` / `approved` / `rejected`) DEFAULT `pending`
  - `image_quality_score` int (1–10)
  - `attribution` text
  - `alt_text` text
  - `reviewed_at` / `reviewed_by`
  - RLS updated: public sees `approved` only
- [x] `types.generated.ts` updated — `image_review_status` enum added, `images` Row/Insert/Update reflect new columns

### Validators

- [x] `packages/validators/src/images.ts` — `ImageUploadSchema`, `ImageReviewSchema`, `ImageFileValidationSchema`

### Admin

- [x] `/admin/images` — upload (file or URL), version selection, image type, license, quality, attribution, alt text
- [x] `/admin/images` — review queue: Approve / Reject workflow per image
- [x] `/admin/images` — tabs for Pending / Approved / Rejected
- [x] `/admin/images` — stat cards with counts per status

---

## Workstream 2 — Image Dataset Dashboard

- [x] Included in `/admin/images` (status cards + review queue)
- [x] Coverage bar at `/admin/data-quality` shows image gap count

---

## Workstream 3 — Market Data System

### Schema

- [x] Migration 018: `price_observations` extended — `is_archived` bool, `notes` text
- [x] Migration 019: `sources` extended — `market_type` enum, `is_active` bool; `market_type` enum created
- [x] `types.generated.ts` updated — `market_type` enum, new columns on `sources` and `price_observations`

### Validators

- [x] `PriceObservationSchema` updated — `notes` field added

### Admin

- [x] `/admin/prices` — create price observation (version, condition, price, currency, market, source, notes)
- [x] `/admin/prices` — archive / unarchive observations
- [x] `/admin/prices` — filter by version, condition; Active / Archived tabs
- [x] Source required on every observation (selector shows active sources with reliability score)

---

## Workstream 4 — Valuation Engine v1

- [x] `packages/golf-data/src/valuation/engine.ts` — `computeValuation()` function
- [x] `packages/golf-data/src/valuation/types.ts` — legacy types preserved for Phase 3 compatibility
- [x] Inputs: observations, condition multipliers, valuation rule, release year
- [x] Outputs: `{ low, mid, high, currency, confidence, confidence_reason, observation_count, data_age_days }`
- [x] Confidence scoring: count, source reliability, data age, cross-condition flag, vintage flag
- [x] `ok: false` when no data — never fabricates
- [x] All assumptions documented in `docs/valuation/README.md`

---

## Workstream 5 — Data Quality Dashboard

- [x] `/admin/data-quality` — coverage bars (image, price, spec, alias coverage %)
- [x] Versions without approved images (up to 50, link to edit)
- [x] Versions without active price observations (up to 50)
- [x] Versions without technical specs (up to 50)
- [x] Versions without aliases (up to 50)
- [x] Brands without any approved images
- [x] Overview stat cards (total versions, published, images, observations)

---

## Workstream 6 — Acquisition Readiness Layer

- [x] `packages/golf-data/src/acquisition/types.ts` — `PriceProvider`, `ImageProvider`, `VersionProvider`, `SourceProvider` interfaces
- [x] `AcquisitionResult<T>` discriminated union (ok/error)
- [x] Exported from `packages/golf-data/src/index.ts`
- [x] `docs/acquisition/README.md`

---

## Workstream 7 — Documentation

- [x] `docs/images/README.md` — image workflow, types, quality scoring, license values
- [x] `docs/pricing/README.md` — pricing workflow, market types, conditions, sources
- [x] `docs/valuation/README.md` — engine formula, confidence scoring, all assumptions
- [x] `docs/data-quality/README.md` — coverage targets, gap resolution workflows
- [x] `docs/acquisition/README.md` — provider interfaces, legal reminders

---

## Workstream 8 — Phase 3 Completion

- [x] **Segment filter fix**: `search/page.tsx` — segment IDs pre-fetched via `version_segments` join, applied as `.in('id', segmentVersionIds)` — supports multiple segments, pagination, and combination with other filters
- [x] **Lint cleanup**: Fixed import order violation in prices page, removed unused variable in data-quality page; zero ESLint errors
- [x] **Type error fix**: `@ballatlas/golf-data` missing from `apps/web/package.json` — added; `Tables`/`Enums` not exported from `@ballatlas/database` — fixed
- [x] `pnpm type-check` — zero errors ✅
- [x] `pnpm lint` — zero errors ✅

---

## Admin Navigation Updated

New links added to admin layout: **Images**, **Prices**, **Data Quality**
New quick-action cards on admin dashboard for Phase 4 workflows.

---

## Remaining Gaps

| Gap                          | Priority   | Notes                                                                        |
| ---------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `/admin/sources` management  | Medium     | Sources are in DB (seeded) but no admin UI to add/edit them yet              |
| Valuation Engine integration | ~~Medium~~ | ✅ **Resolved in Phase 5** — `computeValuation()` wired into `ValuationCard` |
| Image dimension extraction   | Low        | `width`/`height` stored as null on upload — need sharp or similar            |
| Auth on admin                | High       | Admin has no auth gate — must protect before production                      |
| Sitemap generation           | Medium     | Not yet built (Phase 3 gap carried forward)                                  |
