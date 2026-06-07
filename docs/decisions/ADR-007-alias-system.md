# ADR-007: Ball Alias System

**Status:** Accepted  
**Date:** 2026-06-07

## Context

Golf balls are referred to by many names in the wild: manufacturer short names ("Pro V1"),
abbreviations ("PV1"), misspellings, generational tags ("2023 Pro V1"), and regional names.
A canonical slug like `titleist-pro-v1-2025` is precise for the database but useless for
search, identification, or user input matching.

The alias system needs to:

- Support multiple alias types with different matching semantics
- Remain optional (an alias-free version is still fully functional)
- Be importable from a human-maintained JSON file
- Integrate naturally with future search and identification features

## Decision

### Table structure

`ball_aliases(id, version_id, alias, alias_type, created_at, updated_at)`

The `alias_type` enum distinguishes:

- `common_name` — official short name ("Pro V1")
- `abbreviation` — user-typed shorthand ("PV1", "CS")
- `misspelling` — common errors ("Prov1", "ProV 1")
- `regional_name` — market-specific names
- `generation_tag` — year-qualified names ("Pro V1 2025")

Uniqueness is enforced on `(version_id, lower(alias))` — same alias text cannot appear
twice for the same version, but can map to multiple versions (e.g. "Pro V1" maps to
each generation year).

### Seed data

`packages/golfball-data/raw/aliases.json` uses `version_slug` instead of UUIDs,
resolved during import. Validated by `RawAliasesFileSchema` in `@ballatlas/validators`.

### Import pipeline

Aliases are upserted in Phase 4 of the import pipeline, after versions are confirmed in
the database. The upsert uses `onConflict: 'version_id,alias'` and `ignoreDuplicates: true`
to make re-runs safe.

## Consequences

**Positive:**

- Decoupled from the core version schema — aliases can be added/edited without schema changes
- Enables future fuzzy search on `lower(alias)` with a GIN index if needed
- Enumerated types keep alias semantics clear and queryable

**Negative:**

- Lookup queries must join `ball_aliases` for alias-based search; not needed for slug lookup
- Maintaining alias quality requires discipline — aliases are not auto-generated
- Purely capitalization-variant aliases are rejected by the unique constraint
  (e.g. "Pro V1x" and "Pro V1X" are the same alias after `lower()`)
