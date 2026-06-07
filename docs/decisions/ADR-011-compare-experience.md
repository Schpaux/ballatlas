# ADR-011: Compare Experience Architecture

**Date:** 2026-06-09
**Status:** Accepted
**Deciders:** Principal Architect

---

## Context

Phase 5 introduces a `/compare` page allowing users to evaluate 2–4 golf balls side-by-side. The key design decisions are: how to manage which balls are selected, where the diff logic lives, and how to keep the page shareable and server-rendered.

---

## Decision

### URL as state

Selected ball slugs are stored in the URL as a comma-separated query parameter: `/compare?balls=slug1,slug2`. Maximum 4 balls enforced by slicing at fetch time.

This means:

- The compare page is fully server-rendered (no React state for ball data)
- Compare URLs are shareable and bookmarkable
- Browser history works naturally (back/forward preserves selections)
- No persistence layer needed

### Server-rendered table, client-rendered selector

`CompareTable` is a Server Component. It receives pre-fetched `CompareBallProfile[]` and pre-computed `FieldRow[]` (including highlight tags) and renders static HTML. Zero client-side diff computation.

`BallSelector` is a Client Component. It manages the search input, calls `/api/autocomplete`, and updates the URL via `router.push`. This is the only client-side piece.

### Diff algorithm location

`computeFieldDiff()` lives in `packages/golf-data/src/intelligence/comparison.ts`. The compare page calls it server-side. This makes the logic:

- Testable in isolation (pure function)
- Reusable in `apps/api` (Phase 6)
- Zero client bundle cost

### Field priority order

Fields are rendered in descending product importance: brand → model line → year → segment → compression → construction → cover → launch → spin → feel → dimples → MSRP. Rows where every ball has a null value are omitted to reduce noise.

### Highlight strategy

Four tags drive visual differentiation:

- `highest` (emerald) — highest numeric value
- `lowest` (amber) — lowest numeric value
- `unique` (sky) — only one ball has this string value
- `shared` (neutral) — all balls share this value
- `missing` (muted italic) — null/unknown

---

## Consequences

### Positive

- Fully shareable compare URLs — link to a specific comparison
- Server-rendered table = fast initial paint, no layout shift
- Diff algorithm is a pure function — trivially testable
- Max 4 balls prevents performance degradation from too many Supabase fetches

### Negative

- Navigation on BallSelector changes causes a full server round-trip (acceptable)
- With 4 balls, 4 parallel Supabase queries fire on each page load (acceptable at current scale)

### Future

If comparison becomes high-traffic, consider caching the ball detail data at the edge. The URL structure already supports this cleanly since the full state is in the query string.

---

## Alternatives Considered

**React state for selection:** Would enable optimistic updates but loses shareability and requires hydration. Rejected.

**Single denormalized query:** Supabase doesn't support joining 4 arbitrary rows in a single query without RPC. Rejected in favour of parallel single-ball fetches.
