# ADR-008: Valuation Foundation

**Status:** Accepted  
**Date:** 2026-06-07

## Context

BallAtlas Phase 3 will include a market valuation engine. Before building the engine,
the data model and adjustment logic need a stable foundation. The Phase 2 goal is to
define that structure — not to populate or compute values, but to make Phase 3
implementable without schema changes.

Key requirements:

- Segment-based valuation (tour-premium balls are valued differently from value balls)
- Condition-based price scaling (mint vs. played vs. lake ball)
- Adjustment factors for age, demand, and availability
- Admin-editable rules without code deploys
- Public read access, service-role write access (consistent with all other tables)

## Decision

### Three-table structure

**`valuation_profiles`** — one row per segment (e.g. "tour-premium", "value").
Defines the valuation context. Multiple profiles can exist for A/B testing or
seasonal adjustments; `is_active` flags the live profile.

**`condition_multipliers`** — maps condition labels to price multipliers within a profile.
Examples: mint=1.0, near-mint=0.85, good=0.65, fair=0.40, poor=0.20.
Uniqueness on `(profile_id, lower(condition))`.

**`valuation_rules`** — one row per profile, three multiplicative adjustment factors:

- `age_adjustment` — older balls decay in value (typically ≤ 1.0)
- `demand_adjustment` — popular models command a premium (can be > 1.0)
- `availability_adjustment` — scarce balls carry higher value (can be > 1.0)

Final estimated value = `base_price × condition_multiplier × age_adj × demand_adj × avail_adj`

### Why not a single flat table

Separating condition multipliers from adjustment rules allows the same condition
scale to be re-used across profiles while keeping per-segment tuning independent.
This avoids duplicating condition-to-multiplier mappings if only demand changes.

### What is NOT included in Phase 2

- No actual `base_price` values — those require market data research (Phase 3)
- No automated price collection — Phase 3 will build the scraping/pricing pipeline
- No ball-level valuation overrides — handled in Phase 3 via a separate `ball_valuations` table

## Consequences

**Positive:**

- Schema is stable — Phase 3 adds data and logic, not new tables
- Admin can adjust multipliers without code changes
- Segment isolation means valuation model can differ per market tier

**Negative:**

- Three-join queries required for full valuation computation
- Until Phase 3 populates base prices, the tables remain structurally correct but empty
- Condition labels are free text (`text` column) — consistency depends on discipline,
  not a DB enum, which allows flexibility but risks drift
