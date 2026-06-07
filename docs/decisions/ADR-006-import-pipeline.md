# ADR-006: Import Pipeline Design

**Date:** 2026-06-07  
**Status:** Accepted  
**Deciders:** Principal Architect

---

## Context

The BallAtlas seed dataset requires importing 250–300 curated golf ball
versions with full specifications, visual signatures, and identification
features. This data cannot be scraped (Phase 2 constraint: manual, curated,
deterministic data only).

The pipeline must:

- Be repeatable (idempotent — safe to re-run)
- Validate every record before touching the database
- Resolve relationships by slug (brand → family → version)
- Produce an actionable import report
- Run as a single CLI command: `pnpm import:balls`

---

## Decision

Create a separate `packages/golfball-data` workspace package for:

1. Raw JSON seed files (`raw/`)
2. Import scripts (`scripts/`)

The package is tooling-only — it never ships to production. It does NOT
extend `packages/golf-data` (domain logic) because its concerns are
operational (data files, CLI scripts), not domain.

### Pipeline stages

```
1. LOAD     — Read JSON files from raw/
2. VALIDATE — Run Zod schemas from packages/validators
3. NORMALIZE — Generate slugs, resolve brand→family refs, timestamps
4. DEDUPLICATE — Skip records whose slug already exists in the DB
5. UPSERT   — Insert or update via Supabase service role (bypasses RLS)
6. REPORT   — Print summary: inserted / skipped / failed counts
```

### Idempotency via slug

The slug is the natural identity key for each entity:

- Brand slug: `titleist`
- Family slug: unique within brand — `pro-v1` under `titleist`
- Version slug: globally unique — `titleist-pro-v1-2025`

The import uses `upsert` with `onConflict: 'slug'` so re-running the
pipeline updates existing records rather than duplicating them.

### Raw data format

JSON arrays in `raw/`:

- `brands.json` — 20-30 brands
- `families.json` — 50-70 families (reference brand by `brand_slug`)
- `versions.json` — 250-300 versions (reference family by `brand_slug` +
  `family_slug`); includes inline `specs`, `visual`, `features`, `segments`
- `segments.json` — 6 standard market segments
- `sources.json` — 8-10 trusted data sources

### Service role key usage

The import script uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS.
This is intentional — import is an admin operation run server-side.
The service role key is never exposed client-side.

---

## Consequences

### Positive

- Clean separation: seed data files are version-controlled alongside
  import logic in one package
- Idempotent — safe to run repeatedly during development
- Zod validation catches malformed records before they reach the DB
- TypeScript script with tsx — same toolchain as the rest of the project
- Report output makes it easy to audit what was imported

### Negative

- Adding a new ball requires editing a JSON file and re-running the script
- JSON files are not the most ergonomic format for humans (vs CSV/YAML)
  — chosen for programmatic consistency and Zod schema alignment
- The pipeline does not handle image uploads (images are added via admin
  or a future media import pipeline)

### Future path

Phase 4 will add a bulk CSV/JSON upload via the admin UI. The import
pipeline in `packages/golfball-data` serves as the developer-facing
counterpart. The two can share Zod schemas from `packages/validators`.

---

## Alternatives Considered

**SQL seed files (supabase/seed.sql):**
Supabase's `seed.sql` runs on every `supabase db reset`. Suitable for
small reference data (segments, sources). Not suitable for 300 ball
records that will be updated over time. The pipeline approach gives
us control over when and what is imported.

**Admin UI as the only data entry point:**
Viable for ongoing data entry but not for the initial bulk seed. The
CLI pipeline handles bulk imports; the admin UI handles incremental
additions.

**Prisma seed:**
Adds Prisma as a dependency solely for seeding. Unnecessary given we
already have the Supabase client. Adds complexity for zero benefit.
