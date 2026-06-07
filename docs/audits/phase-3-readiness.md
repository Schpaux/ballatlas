# Phase 3 Readiness Audit

**Date:** 2026-06-07  
**Auditor:** Pre-implementation review before Phase 3 (Registry Experience)  
**Scope:** Generated types correctness, schema integrity, implementation readiness

---

## 1. Generated Types Audit

### Finding 1 — ARCHITECTURE.md contradicts the types file header (DOCUMENTATION BUG)

**Severity:** Low (documentation inconsistency only — no runtime impact)

`ARCHITECTURE.md` states:

> "The generated file is gitignored because it is always derived from migrations.  
> CI regenerates it as part of the build verification step."

The file itself (`packages/database/src/types.generated.ts`) says the opposite:

> "This file is tracked in git so CI doesn't need supabase CLI installed.  
> Regenerate whenever the database schema changes."

**Reality:** The file IS tracked in git. `ARCHITECTURE.md` is wrong. The file's own header is correct.

**Resolution:** ARCHITECTURE.md updated (see section 4) to reflect the actual strategy: the file is tracked in git, manually regenerated after schema changes, and CI does not require Supabase CLI.

---

### Finding 2 — Types file was manually authored, not CLI-generated

**Severity:** Low (acceptable strategy, accurately reflects migrations)

The file header confirms: "Last manually updated: 2026-06-07". The file was hand-authored to match the migration SQL, not produced by `supabase gen types typescript --local`.

The file accurately reflects all 16 migrations. However, it introduces a human-error risk: if a migration is added without updating this file, types will silently drift from the schema.

**Verification:** Every table, column, enum, and relationship in the types file was cross-checked against migrations 001–016. All match.

**Resolution:** No changes to the types file needed. Once linked to the hosted Supabase project, run `supabase gen types typescript --linked` (or `pnpm supabase:types`) to regenerate after any schema change. Until then, the file must be manually updated after any `ALTER TABLE` or `CREATE TABLE` migration. This constraint is documented in `packages/database/src/types.generated.ts` header.

---

### Finding 3 — search_vector generated columns absent from types (EXPECTED)

**Severity:** None

Migrations 002, 003, and 004 add `search_vector tsvector GENERATED ALWAYS AS (...) STORED` columns to `brands`, `ball_families`, and `ball_versions`. These columns do not appear in `types.generated.ts`.

This is the expected output of `supabase gen types typescript` — generated/computed columns are omitted from TypeScript Row types because they are not independently writable. The API uses `.textSearch('search_vector', q)` which operates at the PostgREST layer and does not require the column to be typed. No action needed.

---

### Finding 4 — All tables, enums, and relationships verified correct

**Result: PASS**

| Migration | Tables Created                                                   | In types.generated.ts                               |
| --------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| 001       | 9 enums + `update_updated_at()` function                         | All 9 enums present ✓                               |
| 002       | `brands`                                                         | ✓                                                   |
| 003       | `ball_families`                                                  | ✓                                                   |
| 004       | `ball_versions`                                                  | ✓                                                   |
| 005       | `technical_specs`                                                | ✓                                                   |
| 006       | `segments`                                                       | ✓ (no timestamps — static reference table)          |
| 007       | `version_segments`                                               | ✓ (composite PK, no id — matches types)             |
| 008       | `visual_signatures`                                              | ✓                                                   |
| 009       | `identification_features`                                        | ✓ (append-only: `created_at` only, no `updated_at`) |
| 010       | `images`                                                         | ✓ (append-only: `created_at` only, no `updated_at`) |
| 011       | `sources`                                                        | ✓                                                   |
| 012       | `price_observations`                                             | ✓                                                   |
| 013       | RLS policies only                                                | N/A                                                 |
| 014       | Storage buckets only                                             | N/A                                                 |
| 015       | `ball_aliases` + `alias_type_enum`                               | ✓                                                   |
| 016       | `valuation_profiles`, `condition_multipliers`, `valuation_rules` | ✓                                                   |

**Enum cross-check (all match migrations):**

| Enum                          | Migration                                                         | Types |
| ----------------------------- | ----------------------------------------------------------------- | ----- |
| `ball_status`                 | draft/published/archived/discontinued                             | ✓     |
| `ball_finish`                 | glossy/matte/satin                                                | ✓     |
| `launch_profile`              | low/mid/high                                                      | ✓     |
| `spin_profile`                | low/mid/high                                                      | ✓     |
| `feel_profile`                | soft/medium/firm                                                  | ✓     |
| `image_type`                  | hero/logo/alignment/number/side/dimple/packaging                  | ✓     |
| `price_condition`             | new/mint/near_mint/good/fair/recycled/lake_ball                   | ✓     |
| `source_type`                 | manufacturer/retailer/review/community/auction                    | ✓     |
| `identification_feature_type` | 9 values                                                          | ✓     |
| `alias_type_enum`             | common_name/abbreviation/misspelling/regional_name/generation_tag | ✓     |

**Views and Functions:** Both correctly empty (`Record<string, never>`). The `update_updated_at()` trigger is a procedural function — not a PostgREST-queryable function — so its absence from `Functions` is correct.

---

## 2. Schema Readiness

All Phase 3 UI requirements are supported by the existing schema without any schema changes:

| Phase 3 Feature                 | Supporting Tables                                                |
| ------------------------------- | ---------------------------------------------------------------- |
| Hero — brand / family / version | `brands`, `ball_families`, `ball_versions`                       |
| Technical specs display         | `technical_specs`                                                |
| Visual identification section   | `visual_signatures`, `identification_features`                   |
| Segment badges                  | `segments`, `version_segments`                                   |
| Ball images gallery             | `images`                                                         |
| Valuation display               | `valuation_profiles`, `condition_multipliers`, `valuation_rules` |
| Similar balls                   | `technical_specs` (compression, segment)                         |
| Search (FTS)                    | `ball_versions.search_vector` (GIN index)                        |
| Alias search                    | `ball_aliases` (lower-case index)                                |

No migrations are required for Phase 3.

---

## 3. Dataset Readiness

| Entity   | Count | Assessment                                        |
| -------- | ----- | ------------------------------------------------- |
| Brands   | 21    | Good coverage                                     |
| Families | 75    | Solid                                             |
| Versions | 250   | Sufficient for launch                             |
| Aliases  | 51    | Sparse — key lines covered, expands incrementally |

Note: Migrations have not yet been applied to the hosted Supabase project. Technical specs, visual signatures, and segments are in the schema but seed data coverage is unknown until import runs. The import pipeline (`pnpm import:balls`) is built and validated.

---

## 4. Phase Definition Reconciliation

`ROADMAP.md` labels Phase 3 as "Valuation Engine". The Phase 3 prompt redefines it as "Registry Experience" — public home page, search, and ball detail pages. This is correct and supersedes the roadmap. Reasoning:

- Several Phase 2 deliverables (search + detail pages, SEO, sitemap) were deferred and are included in Phase 3.
- The valuation foundation (schema + admin) is already in Phase 2.
- Phase 3 = first real user experience = registry + valuation display.
- ROADMAP.md will be updated to reflect this.

---

## 5. Conclusion

**Phase 3 is cleared to proceed.**

- Types file is accurate and complete relative to all 16 migrations.
- Schema supports all Phase 3 UI requirements without changes.
- One documentation fix required (ARCHITECTURE.md — tracking strategy).
- Alias search requires the alias lookup to join through `ball_versions` to `ball_families` to `brands` — the existing `/api/search` route covers this via `search_vector`, but alias-specific lookup (exact alias match) needs a separate code path in Phase 3.

**Actions taken as part of this audit:**

- [x] `docs/audits/phase-3-readiness.md` — this document
- [ ] `ARCHITECTURE.md` — fix types tracking statement (see section 1, Finding 1)
- [ ] `ROADMAP.md` — update Phase 3 name and deliverables
