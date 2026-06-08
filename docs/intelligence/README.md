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

---

# Identification Engine

Phase 7 deterministic identification services in `packages/golf-data/src/identification/`.

Pure functions only — no DB client, no framework imports. The Next.js layer loads candidates; the engine scores them.

---

## Modules

### config.ts — Identification weights

```typescript
DEFAULT_IDENTIFICATION_WEIGHTS: IdentificationWeights
IDENTIFICATION_CONFIDENCE_THRESHOLD: number // 30 — minimum confidence to surface a candidate
IDENTIFICATION_MAX_RESULTS: number // 8
```

**Weight table (defaults):**

| Factor            | Max points | Signal                                           |
| ----------------- | ---------- | ------------------------------------------------ |
| Brand match       | 40         | Brand text or `brandName` contains observed term |
| Logo text match   | 20         | Model text or `visual.logoText` contains term    |
| Alignment marking | 15         | Alignment feature or `visual.alignmentMarking`   |
| Number color      | 10         | Exact match on number color feature              |
| Logo style        | 5          | Logo feature or `visual.logoStyle` contains term |
| Play number       | 5          | Exact match on play number feature               |
| Other visual      | 5          | First match among color, finish, visual_pattern  |

Maximum possible score: 100. Confidence = `rawScore / totalWeight × 100`.

Weights are the tunable surface. Never hardcode points in `engine.ts`.

---

### engine.ts — Scoring engine

**Signature:**

```typescript
identifyBall(
  observed: ObservedFeatures,
  candidates: IdentificationCandidate[],
  weights?: IdentificationWeights,
  confidenceThreshold?: number,
  maxResults?: number
): IdentificationResult[]
```

`ObservedFeatures` — all fields optional; at least one must be provided by the caller.  
`IdentificationCandidate` — pre-loaded from DB by the Next.js layer.  
Returns results sorted descending by confidence, then rawScore. Candidates below threshold are excluded.

Each `IdentificationResult` includes:

- `confidence` — 0–100, evidence-based (not a probability)
- `matchedFeatures: MatchedFeature[]` — which features matched and how many points each earned
- `missingFeatures: string[]` — categories not provided by the user (potential improvement hints)
- `explanation` — one-sentence plain-English summary

**Matching strategy:**

- Text fields (brand, logoText, alignmentMarking, logoStyle, visualPattern): case-insensitive `includes()` in either direction
- Enum fields (numberColor, playNumber, coverFinish, primaryColor): case-insensitive exact match

---

### contracts.ts — AI readiness layer

Defines the interface between a future vision pipeline and the identification engine.

```typescript
FeatureExtractionInput // what a vision pipeline receives (image URL + optional hints)
FeatureExtractionResult // what a vision pipeline returns — structurally identical to ObservedFeatures
```

**Critical invariant:** `FeatureExtractionResult` is structurally identical to `ObservedFeatures`. A future AI system produces it; the engine consumes it without modification. This boundary must not drift.

---

### coverage.ts — Identification readiness scoring

```typescript
computeIdentificationCoverage(versions: CoverageInput[]): IdentificationCoverageReport
```

Readiness levels per version: `full` | `partial` | `minimal` | `none`.

| Level     | Condition                                       |
| --------- | ----------------------------------------------- |
| `full`    | Has brand text + model text + ≥1 other feature  |
| `partial` | Has brand text or model text                    |
| `minimal` | Has ≥1 feature but neither brand nor model text |
| `none`    | No identification features at all               |

Used by `/admin/data-quality` — Identification Readiness section.

---

## Adding a new observed feature

1. Add the field to `ObservedFeatures` in `engine.ts`
2. Add a weight key to `IdentificationWeights` in `config.ts` and a default value
3. Add scoring logic in `identifyBall()` following the existing pattern
4. Update `FeatureExtractionResult` in `contracts.ts` to match
5. Update this document

## Tuning identification weights

Edit `packages/golf-data/src/identification/config.ts`.  
Do not touch the algorithm in `engine.ts` — the weights are the only tunable surface.
