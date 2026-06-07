# Data Quality

The data quality dashboard (`/admin/data-quality`) is the operational hub for
identifying gaps and prioritizing enrichment work.

---

## Core Principle

**Missing values are acceptable. Fabricated values are not.**

A version with `compression = null` is honest. A version with `compression = 90`
entered without a real source is a liability.

## Coverage Metrics

The dashboard tracks four coverage dimensions for all published versions:

| Dimension      | Target | Notes                                 |
| -------------- | ------ | ------------------------------------- |
| Image coverage | 100%   | At least one approved hero image      |
| Price coverage | 70%+   | At least one active price observation |
| Spec coverage  | 90%+   | At least one `technical_specs` row    |
| Alias coverage | 60%+   | At least one common_name alias        |

These targets are aspirational, not enforced. The dashboard surfaces gaps;
humans decide what to fill first.

## Coverage Score Color Coding

| Score  | Color  | Meaning         |
| ------ | ------ | --------------- |
| ≥ 80%  | Green  | Good coverage   |
| 50–79% | Yellow | Needs attention |
| < 50%  | Red    | Critical gap    |

## Gap Resolution Workflows

### Missing Images

→ `/admin/images` → Add Image → Upload file or register source URL
→ Approve after review

### Missing Prices

→ `/admin/prices` → Add Price Observation → Select source (must exist in sources)
→ Valuation engine updates confidence automatically

### Missing Specs

→ `/admin/versions/{id}/edit` → Fill technical specs → Save

### Missing Aliases

→ `/admin/aliases` → Add Alias → Set type to `common_name`

## Orphaned Records

Records without a valid parent reference (e.g. `version_segments` pointing to a
deleted version) should be cleaned up via direct DB operations. The dashboard
does not currently detect orphans — add a Supabase SQL query if this becomes needed.

## Data Freshness

Price observations older than 365 days reduce Valuation Engine confidence.
Check the Prices section of the dashboard for stale data that may need refreshing.

## Future Enhancements

- Orphan detection (foreign key violations)
- Low-confidence valuation list (confidence < 0.4)
- Spec completeness score (how many non-null fields per version)
- Image type gap analysis (which versions lack a `hero` specifically)
- Source health check (dead URLs in `sources` table)
