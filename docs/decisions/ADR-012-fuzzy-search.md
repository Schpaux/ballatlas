# ADR-012: Fuzzy Search Strategy — pg_trgm

**Date:** 2026-06-09
**Status:** Accepted
**Deciders:** Principal Architect
**Supersedes:** Fuzzy search section of ADR-005 (noted as future work)

---

## Context

ADR-005 adopted PostgreSQL FTS (`tsvector` / `tsquery`) as the primary search mechanism and explicitly noted that `pg_trgm` should be enabled if fuzzy/typo-tolerant matching became a priority. In Phase 5, two needs have surfaced:

1. **Fuzzy matching in main search:** Queries like `ProV1`, `Prov1`, `Pro V-1` should resolve to `Pro V1`. FTS stemming handles words but not compact strings with missing spaces or hyphens.

2. **Autocomplete:** The new `/api/autocomplete` endpoint needs fast prefix + substring matching across `ball_versions.name`, `brands.name`, and `ball_families.name`. These columns are not in the FTS `search_vector` in a way that supports `ilike`-with-index.

---

## Decision

Enable the `pg_trgm` PostgreSQL extension and add trigram GIN indexes to the three name columns.

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_ball_versions_name_trgm ON ball_versions USING GIN (name gin_trgm_ops);
CREATE INDEX idx_brands_name_trgm          ON brands USING GIN (name gin_trgm_ops);
CREATE INDEX idx_ball_families_name_trgm   ON ball_families USING GIN (name gin_trgm_ops);
```

### Integration with existing FTS

The trigram indexes coexist with the existing `search_vector` GIN indexes — they operate on separate columns. No existing search logic changes.

For the main search page, the existing FTS path is kept as the primary. The autocomplete endpoint uses `ilike '%q%'` which now benefits from the trigram index for fast index scans instead of full-table scans.

If the main search returns fewer than 3 results for a query, a trigram similarity fallback can be added in a later micro-iteration: `similarity(name, $1) > 0.3 ORDER BY similarity DESC`.

---

## Consequences

### Positive

- Autocomplete `ilike` queries become index-backed (fast even as dataset grows to 10,000+ rows)
- Fuzzy matching for compact queries (`ProV1` → `Pro V1`) is possible
- No new infrastructure — pg_trgm is a bundled PostgreSQL extension
- Additive with Phase 7 pgvector — separate columns, no conflict

### Negative

- Trigram GIN indexes are larger than B-tree indexes (~2–3× the data size for the column)
- At current scale (~300 versions, ~30 brands) this is immaterial

### Future

Phase 7 will add pgvector for semantic search. The combination of FTS + trigram + vector gives three complementary search paths: keyword relevance, typo tolerance, and semantic similarity.

---

## Migration

`supabase/migrations/20260609000002_enable_pg_trgm.sql`
