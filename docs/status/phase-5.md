# Phase 5 — Registry Intelligence & Discovery

**Started:** 2026-06-09
**Status:** ✅ Complete

---

## Pre-Phase 4 Gap Resolution

- [x] Valuation Engine wired into `ValuationCard` — `computeValuation()` called in `balls/[slug]/page.tsx`, result passed to component; old inline calculation removed

---

## Workstream 1 — Compare Experience

- [x] `/compare` page — Server Component, URL state (`?balls=slug1,slug2,...`), max 4
- [x] `CompareTable` — Server Component, highlights highest/lowest/unique/shared/missing
- [x] `BallSelector` — Client Component, autocomplete, chip removal, URL navigation
- [x] `computeFieldDiff()` — pure function in `packages/golf-data/src/intelligence/comparison.ts`
- [x] `buildDifferenceSummary()` — 2-ball difference sentences
- [x] ADR-011: Compare Experience Architecture

---

## Workstream 2 — Similarity Engine

- [x] `SimilarityWeights` config in `packages/golf-data/src/intelligence/config.ts`
- [x] `computeSimilarityScore()` + `rankBySimilarity()` in `similarity.ts`
- [x] `SimilarBalls` component refactored to use engine — scores, ranks, surfaces reasons
- [x] `SimilarityReason` labels shown as chips on each result card

---

## Workstream 3 — Brand Explorer

- [x] `/brands` — listing with version + family counts
- [x] `/brands/[slug]` — brand detail with family explorer, segment distribution, timeline
- [x] `FamilyCard` component — year range, segments, version links
- [x] Brand breadcrumb link added to `/balls/[slug]`
- [x] Brands added to SiteHeader nav

---

## Workstream 4 — Intelligence Layer

- [x] `SEGMENT_DESCRIPTIONS` static map in `summaries.ts`
- [x] `buildBallSummary()` — deterministic template, used in ball detail metadata + JSON-LD
- [x] `buildDifferenceSummary()` — compare page difference sentences
- [x] `getSegmentDescription()` helper
- [x] `docs/intelligence/README.md`

---

## Workstream 5 — Data Completeness

- [x] `computeCompleteness()` in `packages/golf-data/src/intelligence/completeness.ts`
- [x] `DataCompletenessCard` component — weighted score, category bars, missing fields
- [x] Wired into `/balls/[slug]` right column (below ValuationCard)
- [x] Ball detail query updated to include `images(review_status)` for `hasApprovedImage`

---

## Workstream 6 — Community Feedback Foundation

- [x] Migration: `feedback_submissions` table with `feedback_type` enum
- [x] `source_url` field (optional) — user can cite their source
- [x] RLS: public insert only, no public read
- [x] `FeedbackSubmissionSchema` Zod validator
- [x] `FeedbackForm` — Client Component with `useActionState`
- [x] `submitFeedback` Server Action in `app/balls/[slug]/actions.ts`
- [x] `/admin/feedback` — type-filtered list with pagination
- [x] Feedback link added to admin layout nav
- [x] `types.generated.ts` updated — `feedback_submissions` Row/Insert/Update + `feedback_type` enum

---

## Workstream 7 — Search Intelligence

- [x] `pg_trgm` extension enabled — migration 20260609000002
- [x] Trigram GIN indexes on `ball_versions.name`, `brands.name`, `ball_families.name`
- [x] `/api/autocomplete?q=` — suggestions across versions, brands, families
- [x] `SearchBar` updated with suggestion dropdown, keyboard navigation (↑↓ Enter Esc)
- [x] ADR-012: Fuzzy Search Strategy

---

## Workstream 8 — SEO Foundation

- [x] `app/sitemap.ts` — dynamic sitemap covering home, search, brands, ball detail pages
- [x] `app/robots.ts` — disallows `/admin`, sitemap pointer
- [x] JSON-LD `Product` schema on `/balls/[slug]` using `buildBallSummary()` for description
- [x] `generateMetadata()` on ball detail updated to use `buildBallSummary()`
- [x] Brand + brand detail pages have full metadata

---

## Workstream 9 — Documentation

- [x] `docs/discovery/README.md`
- [x] `docs/comparison/README.md`
- [x] `docs/intelligence/README.md`
- [x] ADR-011, ADR-012
- [x] `docs/status/phase-5.md`
- [x] ROADMAP.md updated — phase renumbering
- [x] CLAUDE.md updated — Phase 5 conventions
- [x] ARCHITECTURE.md updated — new routes + intelligence package

---

## Remaining Gaps (not in scope for Phase 5)

| Gap                                                              | Phase                      |
| ---------------------------------------------------------------- | -------------------------- |
| Admin authentication                                             | Pre-production requirement |
| Similarity engine weight tuning (needs real user data)           | Ongoing                    |
| Trigram fuzzy fallback in main search when FTS returns 0 results | Phase 5.1                  |
| Segment distribution chart on brand page                         | Nice-to-have               |
| Feedback admin bulk actions (dismiss, mark resolved)             | Phase 5.1                  |
