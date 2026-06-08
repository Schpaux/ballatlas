# ADR-014: Product Domain Generalization

**Date:** 2026-06-10  
**Status:** Proposed  
**Phase:** 6 — Platform Generalization & Asset Strategy

> **NOT ACCEPTED.** This ADR documents a proposed migration path for when (if) BallAtlas
> expands beyond golf balls. No code changes are authorized by this ADR.
> When and if equipment categories are introduced, this ADR should be revisited,
> validated against the current state of the codebase, and moved to Accepted.

---

## Context

BallAtlas models golf products as:

```
Brand → Family → Version
```

The current implementation is correct for golf balls. As the platform grows, it may
need to support other golf equipment (drivers, irons, putters, bags) or eventually
other sports equipment. The question is whether the current Brand/Family/Version
hierarchy can evolve into a more general:

```
Manufacturer → Product Line → Product Version
```

without requiring a rewrite.

This ADR does not propose building new product categories. It proposes the migration
strategy to be followed when that decision is made by the business.

See `docs/platform/generalization-review.md` for the full architectural analysis.

---

## Proposed Decision

### Rename, don't replace

The three-tier hierarchy is already correct. The names `Brand`, `Family`, and `Version`
are domain vocabulary that happens to map exactly to the general case:

| Current name | General meaning | Rename needed?                                    |
| ------------ | --------------- | ------------------------------------------------- |
| `Brand`      | Manufacturer    | No — Brand is understood in all product contexts  |
| `Family`     | Product Line    | No — "family" is common product taxonomy language |
| `Version`    | Product Version | No — universally understood                       |

**Recommendation: do not rename** the core tables. Add a `product_category` discriminator
to `ball_versions` when the first non-ball product is introduced instead.

### Migration path for multi-category support

**Step 1 — Add category discriminator**

```sql
CREATE TYPE product_category AS ENUM ('golf_ball', 'driver', 'iron', 'putter', 'wedge', 'fairway_wood', 'hybrid', 'bag', 'rangefinder');

ALTER TABLE ball_versions
  ADD COLUMN product_category product_category NOT NULL DEFAULT 'golf_ball';

-- Rename to product_versions (optional — can stay as ball_versions for compatibility)
-- ALTER TABLE ball_versions RENAME TO product_versions;
```

Rename is deferred: if kept as `ball_versions`, add a view `product_versions` for
compatibility with future API consumers.

**Step 2 — Introduce per-category spec tables**

Each new product category gets its own spec table, joined to `ball_versions` (or
`product_versions`):

```sql
CREATE TABLE driver_specs (
  version_id     uuid UNIQUE REFERENCES ball_versions(id) ON DELETE CASCADE,
  loft           numeric,
  shaft_flex     text,
  head_volume_cc integer,
  adjustable     boolean,
  face_material  text,
  notes          text
);

CREATE TABLE putter_specs (
  version_id      uuid UNIQUE REFERENCES ball_versions(id) ON DELETE CASCADE,
  head_style      text,  -- blade, mallet, face-balanced
  hosel_type      text,
  loft            numeric,
  lie             numeric,
  face_insert     text,
  notes           text
);
```

`technical_specs` (golf ball) remains unchanged. Its name becomes a concrete spec table
rather than the generic one.

**Step 3 — Generalize segments with domain discriminator**

```sql
ALTER TABLE segments ADD COLUMN domain text NOT NULL DEFAULT 'golf_ball';

-- Existing: domain = 'golf_ball'
-- New driver segments: domain = 'driver'
```

Queries filter by domain. The segment system becomes multi-domain without schema changes.

**Step 4 — Generalize image_type enum**

```sql
ALTER TYPE image_type ADD VALUE 'specification_sheet';
ALTER TYPE image_type ADD VALUE 'lifestyle';
ALTER TYPE image_type ADD VALUE 'detail';
```

Alternatively, extend with a `product_category` column on the `images` table to
allow category-specific type vocabularies.

**Step 5 — URL routing**

New routes are additive:

```
/balls/[slug]      ← Golf balls (existing — no change)
/drivers/[slug]    ← Drivers (new)
/putters/[slug]    ← Putters (new)
```

A shared `product_versions` lookup by slug continues to work; the page routes branch
on `product_category` to render the right spec display.

**Step 6 — Similarity and intelligence**

The similarity algorithm (`packages/golf-data/src/intelligence/similarity.ts`) is
ball-specific. When new categories are introduced:

- Extract the scoring logic to be injectable (weights already support this)
- Introduce category-specific weight configs alongside `DEFAULT_SIMILARITY_WEIGHTS`
- Example: `DEFAULT_DRIVER_SIMILARITY_WEIGHTS` in the same `config.ts`

No code deletion required — the golf ball algorithm remains as-is.

---

## Advantages

- **Additive migration** — existing ball data and code is untouched
- **Familiar pattern** — per-category spec tables already mirrors how `technical_specs`
  works; we're extending a known pattern
- **URL stability** — `/balls/[slug]` never changes; new routes are additive
- **Package isolation** — `packages/golf-data/src/intelligence/` stays ball-specific;
  new category logic lives alongside it, not replacing it
- **Search is unchanged** — FTS on `name` works identically for all product types

## Risks

| Risk                                                                | Severity | Mitigation                                                      |
| ------------------------------------------------------------------- | -------- | --------------------------------------------------------------- |
| `ball_versions` table name becomes misleading when it holds drivers | Medium   | Add `product_versions` view as alias                            |
| Per-category spec tables create N+1 queries on list pages           | Medium   | List views query base table only; spec join on detail page      |
| `product_category` enum requires migration for each new category    | Low      | Enum extension is backward compatible in Postgres               |
| Admin UI multiplies complexity with each new category               | High     | Invest in a dynamic spec form system before adding 3rd category |

## Migration complexity: Low to Medium

- All schema changes are additive (ALTER ADD COLUMN, new tables, enum values)
- No existing rows need updating beyond backfilling `product_category = 'golf_ball'`
- Application code changes are limited to new routes and new spec display components
- The import pipeline needs a new pipeline per category (not a rewrite of existing)

## Data model impact

The base hierarchy tables (`brands`, `ball_families`, `ball_versions`) gain one column.
All other tables are unchanged. New spec tables are created per category.

## API impact (Phase 7)

The `/v1/balls` endpoint remains valid forever. New endpoints `/v1/drivers`, `/v1/putters`
are additive. A `/v1/products` cross-category endpoint can be added without changing
existing endpoints.

## Search impact

FTS is on `name` column — works identically for all product types. Category-specific
filtering can be added with a `product_category` param on existing search endpoints.

## Valuation impact

The three-table valuation structure (profiles + multipliers + rules) is already generic.
New `valuation_profiles` rows scoped to `domain = 'driver'` (or similar) handle driver
valuation independently. No schema changes.

## Intelligence impact

See Step 6 above — category-specific weight configs sit alongside golf ball config.
The algorithm doesn't change; the weights do.

---

## Alternatives Considered

**Alternative A: Single polymorphic `product_specs` JSONB column**

Store category-specific specs as JSONB on `ball_versions`. Flexible but loses TypeScript
type safety and makes filtering by spec value (e.g., "all drivers with loft < 10°") require
JSONB operators. Chosen against.

**Alternative B: EAV (Entity-Attribute-Value) spec table**

A single `product_spec_values(version_id, key, value)` table. Maximum flexibility,
minimum type safety. Queries are painful, validation is impossible without application
logic, and performance degrades at scale. Chosen against.

**Alternative C: Full domain rewrite when categories are added**

Build a new `products` schema from scratch when drivers are introduced. Maximum
correctness, maximum disruption, maximum risk. Explicitly ruled out — the current
model is good enough to extend.

---

## References

- `docs/platform/generalization-review.md` — full architectural analysis
- `docs/platform/future-equipment-strategy.md` — per-category analysis
- ADR-004: Database Schema Hierarchy — current model rationale
- ADR-013: Asset Management Strategy — asset system design
