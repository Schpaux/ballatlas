# Identification Intelligence

Phase 7 identification system. BallAtlas owns the identification logic; future AI systems own feature extraction.

---

## Architecture

```
User observes a golf ball
    ↓
ObservedFeatures (brand, logoText, alignmentMarking, numberColor, ...)
    ↓
identifyBall(observedFeatures, candidates)
    ↓
IdentificationResult[] (ranked, scored, explained)
    ↓
Ball Detail + Valuation
```

The engine is a pure function in `packages/golf-data/src/identification/engine.ts`. It has no DB dependency. The Next.js route handler loads candidates from Supabase and passes them to the engine.

---

## Modules

### config.ts — Identification weights

```typescript
DEFAULT_IDENTIFICATION_WEIGHTS: IdentificationWeights
IDENTIFICATION_CONFIDENCE_THRESHOLD: number // 30 — minimum to include in results
IDENTIFICATION_MAX_RESULTS: number // 8 — maximum candidates returned
```

Default weights:

| Category          | Points | Mapped To                                       |
| ----------------- | ------ | ----------------------------------------------- |
| Brand match       | 40     | `brand_text` features / `brandName`             |
| Logo text         | 20     | `model_text` features / `visual.logoText`       |
| Alignment marking | 15     | `alignment_marking` / `visual.alignmentMarking` |
| Number color      | 10     | `number_color` / `visual.numberColor`           |
| Logo style        | 5      | `logo` / `visual.logoStyle`                     |
| Play number       | 5      | `play_number` features                          |
| Other visual      | 5      | `color`, `finish`, `visual_pattern`             |

Total possible: 100 points.

Confidence = earned_points / 100 × 100 (always denominated against full weight).

---

### engine.ts — Core scoring function

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

**Input:** `ObservedFeatures` — all fields optional, at least one must be present.

**Output:** `IdentificationResult[]` — sorted descending by confidence, filtered above threshold.

Each result includes:

- `confidence` — 0-100 evidence-based score
- `matchedFeatures` — which categories matched with points earned
- `missingFeatures` — categories user did not provide (could improve result)
- `explanation` — plain English sentence

**Matching strategy:**

- Text fields (brand, logoText, logoStyle, alignmentMarking, visualPattern): `includes()` both directions, case-insensitive
- Enum fields (numberColor, primaryColor, coverFinish, playNumber): exact match, case-insensitive
- Each feature is checked against both `identification_features` rows AND `visual_signatures` columns

---

### coverage.ts — Identification coverage service

```typescript
computeIdentificationCoverage(
  candidates: CandidateCoverageInput[]
): IdentificationCoverageSummary
```

Measures how "identifiable" each ball version is:

| Readiness | Criteria                                                                    |
| --------- | --------------------------------------------------------------------------- |
| `full`    | Has visual signature + identification features with brand_text + model_text |
| `partial` | Has visual or has features with brand/model text                            |
| `minimal` | Has some data but missing key features                                      |
| `none`    | No identification data                                                      |

Used by `/admin/data-quality` Identification Readiness section.

---

### contracts.ts — AI readiness interfaces

```typescript
FeatureExtractionInput // What a vision pipeline receives
FeatureExtractionResult // What a vision pipeline returns (same shape as ObservedFeatures)
```

Future Phase 9 workflow:

```
FeatureExtractionInput (image path + context)
    ↓
Vision model
    ↓
FeatureExtractionResult
    ↓
identifyBall(result, candidates)  ← no transformation needed
```

---

## Data layer

Two complementary data sources per candidate:

### identification_features table

Typed key-value pairs. Each row is one detectable feature.

| feature_type        | Example value              | Importance |
| ------------------- | -------------------------- | ---------- |
| `brand_text`        | "Titleist"                 | 10         |
| `model_text`        | "Pro V1"                   | 10         |
| `logo`              | "Titleist cursive script"  | 9          |
| `alignment_marking` | "Triple Track"             | 9          |
| `number_color`      | "black"                    | 6          |
| `color`             | "white"                    | 8          |
| `finish`            | "glossy"                   | 6          |
| `dimple_pattern`    | "388 tetrahedral dimples"  | 5          |
| `special_marking`   | "Truvis hexagonal pattern" | 7          |
| `play_number`       | "3"                        | 3          |
| `number_style`      | "standard"                 | 4          |
| `visual_pattern`    | "Truvis hexagonal"         | 8          |

### visual_signatures table

Structured per-ball columns. The engine reads these as fallback when identification_features rows don't cover a field.

Columns used by engine: `primary_color`, `finish`, `logo_style`, `logo_text`, `alignment_marking`, `number_color`, `special_markings`.

---

## API

### POST /api/identify

Request body: `ObservedFeatures` (JSON)
Response: `{ data: IdentificationResult[], error: null }`

At least one feature is required. Returns up to 8 ranked candidates.

---

## UI

### /identify

Feature-driven identification page. User enters observable characteristics; engine returns ranked candidates. No image upload. No AI.

Components:

- `IdentificationForm` — client component with input fields for each feature category
- `IdentificationResultCard` — displays confidence, matched features, explanation

---

## Tuning identification

To change scoring behavior, edit `packages/golf-data/src/identification/config.ts`.
Do not modify algorithm logic in `engine.ts`.

To add a new feature category:

1. Add a migration to extend the `identification_feature_type` enum
2. Update `IdentificationFeatureTypeSchema` in `packages/validators/src/visual.ts`
3. Update `packages/database/src/types.generated.ts`
4. Add the feature to `ObservedFeatures` in `engine.ts`
5. Add scoring logic in the appropriate section of `identifyBall()`
6. Add a weight key to `IdentificationWeights` in `config.ts`
7. Update this document

---

## Relationship to similarity engine

The identification engine uses brand/visual evidence to narrow candidates.
The similarity engine (`packages/golf-data/src/intelligence/similarity.ts`) uses technical specs to find comparable balls.

These are complementary — identification answers "what is this ball?" while similarity answers "what is comparable to this ball?"

When multiple candidates have similar confidence scores, the UI may optionally surface similarity-ranked alternatives using the existing `rankBySimilarity()` function.
