# ADR-004: Database Schema — Brand / Family / Version Hierarchy

**Date:** 2026-06-07  
**Status:** Accepted  
**Deciders:** Principal Architect  
**Supersedes:** Initial table sketch in ARCHITECTURE.md (golf_balls / manufacturers)

---

## Context

The Phase 1 ARCHITECTURE.md contained a preliminary table sketch:
`golf_balls`, `manufacturers`, `specifications`, `categories`. This was a
placeholder, not a designed schema. Phase 2 requires a production-grade
schema that can support 250–300 versions at launch and scale to thousands
without schema changes.

The research report (docs/research/golf-ball-deep-research-rapport-1.md)
confirmed a clear three-tier hierarchy in the golf ball market:

1. **Brand** — Titleist, Callaway, TaylorMade, etc.
2. **Family / Model** — Pro V1, Chrome Soft, TP5, etc. (under a brand)
3. **Version / Year** — Pro V1 2025, Pro V1 2023, etc. (under a family)

Key constraints identified in research:

- Technical specifications change year-over-year within the same family
- Prices are time-series observations, not single values
- Visual signatures must be first-class entities for future AI identification
- Identification features (logo, markings, alignment aids) need structured
  storage for Phase 5 computer vision
- Every data point should eventually be source-traceable

---

## Decision

Implement a **Brand → Family → Version** three-tier hierarchy as the
canonical data model, replacing the flat `golf_balls` concept.

Additional first-class entities:

- `technical_specs` — one-to-one with version; structured spec data
- `visual_signatures` — one-to-one with version; AI identification support
- `identification_features` — many-to-one with version; key AI asset
- `images` — many-to-one with version; multiple angle types
- `segments` — reference table; market classification
- `version_segments` — many-to-many junction
- `sources` — reference table; data provenance
- `price_observations` — time-series; never overwrite historical prices

All tables use UUIDs (gen_random_uuid()) as primary keys.
All mutable tables have `created_at` and `updated_at` with auto-update
triggers.

---

## Consequences

### Positive

- Year-over-year spec changes are natural — each version is a distinct row
- Price history is preserved as immutable observations
- Visual and identification data as first-class entities means Phase 5 AI
  has clean, structured input without schema migration
- Source traceability can be added incrementally via `sources` table
- The hierarchy maps exactly to how golf ball manufacturers organize
  their product lines

### Negative

- More joins required for full ball detail (brand + family + version + specs)
- Import pipeline must resolve slugs across tiers (family_slug + brand_slug)
- Slug uniqueness strategy requires care:
  - `brands.slug` — globally unique
  - `ball_families.slug` — unique within brand (composite unique constraint)
  - `ball_versions.slug` — globally unique (format: `{brand}-{family}-{year}`)

### Migration path

The old `golf_balls`, `manufacturers` references in ARCHITECTURE.md are
superseded by this schema. ARCHITECTURE.md has been updated in Phase 2
to reflect the new entity names and relationships.

---

## Alternatives Considered

**Flat `golf_balls` table with denormalized fields:**
Simple to query but loses the family relationship. Pro V1 2023 and
Pro V1 2025 would be unrelated rows with no shared context. Filtering
"all Pro V1 versions" would require text matching rather than a FK join.

**EAV (Entity-Attribute-Value) for specifications:**
Flexible for arbitrary specs but loses type safety and makes queries
complex. Technical specs are well-defined enough to be columns.

**JSONB for specs:**
Could store arbitrary spec data. Chosen against because: (1) individual
spec fields need to be filterable (e.g., filter by compression range),
(2) TypeScript type safety is harder with JSONB, (3) indexing individual
JSONB keys is possible but less ergonomic than column indexes.
