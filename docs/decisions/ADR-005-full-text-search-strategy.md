# ADR-005: Full-Text Search Strategy — PostgreSQL FTS

**Date:** 2026-06-07  
**Status:** Accepted  
**Deciders:** Principal Architect

---

## Context

BallAtlas needs search across ball names, brand names, and family names.
Search must support:

- Keyword search: "Pro V1", "Chrome Soft", "Titleist"
- Partial matching: "pro" should find "Pro V1"
- Cross-entity: a single query should search brands, families, and versions
- Filtering: by brand, segment, year, compression, cover material

Phase 7 will add semantic/vector search (pgvector). The Phase 2 search
strategy must not conflict with the Phase 7 roadmap.

---

## Decision

Use **PostgreSQL full-text search** (tsvector / tsquery) with GIN indexes
for Phase 2 search.

### Implementation

1. Each searchable table (`brands`, `ball_families`, `ball_versions`) gets
   a `search_vector tsvector GENERATED ALWAYS AS (...) STORED` computed
   column with a GIN index.

2. The `ball_versions` search vector is a weighted composite:
   - Weight A (highest): version name
   - Weight B: family name
   - Weight C: brand name

   This allows a single FTS query on `ball_versions` to find results
   matching any part of the full name (e.g., "titleist pro v1 2025").

3. Queries use `plainto_tsquery('english', $1)` for user input (handles
   stop words, stemming, spaces as AND).

4. Results ordered by `ts_rank` descending.

### Why a computed column (not a trigger):

Generated stored columns are maintained automatically by PostgreSQL on
every insert/update — no trigger function needed, no risk of drift.
They are also automatically indexed by the GIN index.

---

## Consequences

### Positive

- Zero additional infrastructure — FTS runs inside Supabase PostgreSQL
- Works with existing `@supabase/supabase-js` query builder
- GIN indexes on tsvector are fast for typical registry-scale datasets
- Seamlessly coexists with pgvector (Phase 7) — they are separate columns
- No sync latency (unlike Elasticsearch)

### Negative

- Less sophisticated than dedicated search engines (Typesense, Algolia)
  for fuzzy matching and typo tolerance
- PostgreSQL FTS does not support fuzzy/trigram search natively —
  `pg_trgm` extension would be needed for "titelest" → "titleist"
- Cross-language support requires per-column language config

### Future path

Phase 7 will add `embedding vector(1536)` columns to `ball_versions` for
semantic search via pgvector. The FTS approach in Phase 2 is fully
additive — Phase 7 adds columns and a new search path alongside FTS.

If fuzzy matching becomes a priority before Phase 7, enable `pg_trgm`
extension and add a trigram index alongside the FTS GIN index.

---

## Alternatives Considered

**Typesense / Algolia:**
Excellent search quality, typo tolerance, faceted filtering. Rejected for
Phase 2 because: adds external dependency, requires sync pipeline, and
adds cost. Revisit if PostgreSQL FTS proves insufficient at scale.

**pg_trgm only:**
Trigram matching handles typos but loses relevance ranking that FTS
provides. Trigram indexes are also larger. FTS + pg_trgm can be combined
if needed.

**Supabase full-text search via `.textSearch()`:**
This IS PostgreSQL FTS — we are using it. The Supabase client wraps
`to_tsvector` and `to_tsquery` queries.
