# Comparison Engine

Phase 5 compare experience — `/compare`, `CompareTable`, `BallSelector`, `computeFieldDiff`.

---

## URL Design

```
/compare?balls=titleist-pro-v1-2025,taylormade-tp5-2024
```

- Slugs are comma-separated in the `balls` query parameter
- Maximum 4 balls enforced server-side (extra slugs silently ignored)
- The URL is the complete state — fully shareable, no client storage
- `robots: { index: false }` — no canonical URL to index

See ADR-011 for the full rationale.

---

## computeFieldDiff

**Location:** `packages/golf-data/src/intelligence/comparison.ts`

**Signature:**

```typescript
computeFieldDiff(profiles: CompareBallProfile[]): FieldRow[]
```

**HighlightTag values:**

| Tag       | Meaning                              | Visual       |
| --------- | ------------------------------------ | ------------ |
| `highest` | Highest numeric value across balls   | Emerald      |
| `lowest`  | Lowest numeric value across balls    | Amber        |
| `unique`  | Only this ball has this string value | Sky          |
| `shared`  | All balls share this value           | Neutral      |
| `missing` | Null / unknown                       | Muted italic |

**Field order:** brand → model line → year → segment → compression → construction → cover → launch → spin → feel → dimples → MSRP

Rows where all values are `missing` are omitted from the table.

---

## buildDifferenceSummary

**Location:** `packages/golf-data/src/intelligence/comparison.ts`

**Signature:**

```typescript
buildDifferenceSummary(a: CompareBallProfile, b: CompareBallProfile): string[]
```

Returns up to 3 human-readable sentences describing the most significant differences between two balls. Only relevant for 2-ball comparisons (shown above the table).

**Priority order:** compression → cover material → feel profile → segment

---

## BallSelector

**Location:** `apps/web/components/compare/BallSelector.tsx`

Client Component. Uses `/api/autocomplete` for suggestions. On selection of a `version` type suggestion, adds the slug to the URL. Brand and family suggestions navigate to their respective pages.

Keyboard navigation: ArrowDown/Up to move through suggestions, Enter to select.

---

## CompareTable

**Location:** `apps/web/components/compare/CompareTable.tsx`

Pure Server Component — receives `CompareBallProfile[]` + `FieldRow[]` from the page. No client-side JS involved in rendering the table or computing highlights.
