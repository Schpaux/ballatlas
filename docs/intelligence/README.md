# Intelligence Layer

Phase 5 deterministic intelligence services in `packages/golf-data/src/intelligence/`.

No AI. No LLMs. All outputs are template-driven or algorithm-driven from structured data.

---

## Modules

### config.ts — Similarity weights

```typescript
DEFAULT_SIMILARITY_WEIGHTS: SimilarityWeights
SIMILARITY_THRESHOLD: number // 50 — minimum score to surface as a result
SIMILARITY_MAX_RESULTS: number // 6
```

Weights are a business rule. Change them here to tune "what makes two balls similar" without touching the algorithm. See the table below.

---

### similarity.ts — Scoring engine

**Signature:**

```typescript
computeSimilarityScore(reference: BallProfile, candidate: BallProfile, weights?): { score: number; reasons: SimilarityReason[] }
rankBySimilarity(reference, candidates, weights?, threshold?, maxResults?): SimilarityResult[]
```

**Weight table (defaults):**

| Factor                    | Max points | Condition                               |
| ------------------------- | ---------- | --------------------------------------- | ----- | ----- |
| Primary segment match     | 40         | Same `segments[0].slug`                 |
| Secondary segment overlap | 20         | Any shared segment (not primary)        |
| Compression ≤5 delta      | 25         | `                                       | a - b | ≤ 5`  |
| Compression ≤10 delta     | 20         | `                                       | a - b | ≤ 10` |
| Compression ≤15 delta     | 15         | `                                       | a - b | ≤ 15` |
| Compression ≤20 delta     | 10         | `                                       | a - b | ≤ 20` |
| Compression ≤30 delta     | 5          | `                                       | a - b | ≤ 30` |
| Construction layers       | 10         | Same layer count                        |
| Cover material category   | 10         | Same category (urethane/surlyn/ionomer) |
| Launch profile            | 7          | Same enum value                         |
| Spin profile              | 5          | Same enum value                         |
| Feel profile              | 3          | Same enum value                         |

Maximum possible score: 100. Scores are capped at 100.

Only the top 3 `SimilarityReason` strings are returned per candidate (to avoid card clutter).

---

### completeness.ts — Data coverage scoring

**Signature:**

```typescript
computeCompleteness(input: CompletenessInput): CompletenessResult
```

**Scoring formula:**

```
score = (specsPct × 0.40) + (valuationPct × 0.30) + (visualPct × 0.20) + (imagesPct × 0.10)
```

**Category breakdown:**

| Category        | Fields                                                                                                                    | Weight |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- | ------ |
| Technical Specs | compression, construction_layers, cover_material, core_material, dimple_count, launch_profile, spin_profile, feel_profile | 40%    |
| Valuation       | has at least 1 active price observation                                                                                   | 30%    |
| Visual ID       | primary_color, finish, logo_style, logo_text                                                                              | 20%    |
| Images          | has at least 1 approved image                                                                                             | 10%    |

Returns `missingFields: string[]` — plain-English names of all empty fields, used to render the missing-fields chip list on `DataCompletenessCard`.

---

### comparison.ts — Field diff and difference summaries

See `docs/comparison/README.md` for full documentation.

---

### summaries.ts — Deterministic text generation

**`buildBallSummary(input)`** — returns a single sentence describing a ball from its specs.  
Template tree: segment opening → construction layers → cover material → feel → performance character.  
Missing fields are gracefully omitted.

**`SEGMENT_DESCRIPTIONS`** — authored static map from `SegmentSlug` to `SegmentDescription`.  
Each entry has: `name`, `shortDesc`, `longDesc`, `characteristics[]`.  
Used wherever segment context should be shown in prose rather than a badge.

**`getSegmentDescription(slug)`** — returns `SegmentDescription | null` for a given segment slug.

---

## Adding or tuning weights

To change similarity scoring behaviour, edit `packages/golf-data/src/intelligence/config.ts`.  
Do not change the algorithm in `similarity.ts` — the weights are the tunable surface.

To add a new field to similarity scoring:

1. Add a weight key to `SimilarityWeights` in `config.ts`
2. Add a value to `DEFAULT_SIMILARITY_WEIGHTS`
3. Add the scoring logic in the appropriate section of `computeSimilarityScore` in `similarity.ts`
4. Update this document

To add a new segment description:

1. Ensure the segment slug is in `SEGMENT_SLUGS` in `packages/golf-data/src/taxonomy/segments.ts`
2. Add an entry to `SEGMENT_DESCRIPTIONS` in `summaries.ts`
