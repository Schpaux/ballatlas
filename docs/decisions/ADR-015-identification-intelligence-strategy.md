# ADR-015 — Identification Intelligence Strategy

**Status:** Accepted  
**Date:** 2026-06-11  
**Phase:** 7

---

## Context

BallAtlas has collected structured visual and identification data (visual_signatures,
identification_features) for every ball version in the registry. The next logical step
is to use this data to help a golfer identify a ball they are holding.

Two approaches exist:

1. **Computer vision first**: Upload an image, extract features with a vision model,
   then match against the registry.
2. **Intelligence engine first**: Build the ranking and scoring logic now, define
   the feature contract, then wire vision models up later.

Approach 2 is the correct order. The identification intelligence must be correct and
explainable before any vision model is involved. A vision model that feeds bad data
into a broken engine produces bad identifications. Conversely, a well-tested engine
that receives clean feature extractions — regardless of their source — will produce
correct identifications.

---

## Decision

**BallAtlas owns identification logic. AI owns feature extraction.**

The identification engine is deterministic and explainable. It accepts structured
feature observations (brand, logo text, alignment, number color, etc.), scores every
ball version in the registry against those observations, and returns ranked candidates
with confidence scores and evidence explanations.

Future computer vision systems, OCR pipelines, or any other feature extraction method
will produce a `FeatureExtractionResult` — a structured contract defined in Phase 7.
BallAtlas consumes that contract without modification. The identification engine does
not change when the extraction method changes.

---

## Architecture

### Separation of Concerns

```
Image (future)
    ↓
Feature Extraction (future AI — produces FeatureExtractionResult)
    ↓
identifyBall(observedFeatures, candidates)  ← BallAtlas owns this
    ↓
IdentificationResult[] (ranked, scored, explained)
    ↓
Ball Detail + Valuation
```

### Engine Location

`packages/golf-data/src/identification/` — framework-free, no DB client, no React.

The Next.js app loads candidates from Supabase, passes them to the engine, renders results.
The engine is a pure function over structured data.

### Feature Matching

Observed features are matched against two data sources per candidate:

1. **`identification_features`** rows — typed key-value pairs with importance scores
2. **`visual_signatures`** columns — structured visual attributes

Both sources contribute to scoring. The engine normalizes and de-dupes evidence.

### Scoring Model

Each observable feature category has a configurable weight (0–100). Weights are
defined in `identification/config.ts` — a business rule, not an algorithm detail.

Default weights:

| Category          | Max Points | Feature Type(s)                           |
| ----------------- | ---------- | ----------------------------------------- |
| Brand match       | 40         | `brand_text`                              |
| Logo text match   | 20         | `model_text`                              |
| Alignment marking | 15         | `alignment_marking`                       |
| Number color      | 10         | `number_color`                            |
| Logo style        | 5          | `logo` / `visual_signatures.logo_style`   |
| Play number       | 5          | `play_number`                             |
| Other visual      | 5          | `color`, `finish`, `visual_pattern`, etc. |

Total maximum: 100 points.

Confidence = earned_points / total_feature_weight × 100.

Matching is case-insensitive. Partial matches (includes) are used for text fields.
Exact matches are used for enumerated fields (finish, primary_color).

### Candidate Ranking

The engine always returns multiple candidates. A single certain answer is never
returned — the golfer makes the final determination. Candidates are sorted by
confidence score descending. Where multiple candidates have similar confidence,
the existing similarity engine surfaces "closest alternatives."

### Explainability

Every result includes:

- `matchedFeatures`: which features contributed, with points earned
- `missingFeatures`: which features were not provided (improve search)
- `explanation`: a single plain-English sentence summarizing the match evidence

---

## AI Readiness Contracts

`packages/golf-data/src/identification/contracts.ts` defines:

- **`FeatureExtractionInput`** — what a vision pipeline receives (image metadata,
  context about what type of extraction to perform)
- **`FeatureExtractionResult`** — what a vision pipeline returns; identical in shape
  to `ObservedFeatures` from the identification engine input

When AI image recognition is added (Phase 9), it takes `FeatureExtractionInput` and
returns `FeatureExtractionResult`. The Next.js route passes the result directly to
`identifyBall()` with no transformation.

---

## Consequences

### Positive

- Identification engine is testable in isolation — no images, no AI, no network calls required
- Confidence scores are evidence-based and explainable, not a black-box probability
- Vision models can be swapped or upgraded without changing identification logic
- Engine accuracy can be measured and improved using structured test cases
- Works today, before any vision model is integrated

### Negative

- Identification quality is limited by the quality of structured data in the registry
- Users must manually enter features rather than uploading a photo (Phase 7 experience)
- Feature matching is not fuzzy — misspellings or unexpected phrasing reduce matches

### Mitigations

- Phase 7 expands the dataset to 1000+ versions with rich identification data
- The UI provides dropdowns and suggestions to reduce freeform text input errors
- `pg_trgm` fuzzy search is used for brand/model lookups to tolerate minor typos
- Phase 9 resolves the photo limitation by adding vision-based feature extraction

---

## Alternatives Considered

### Computer vision first (rejected)

Integrating OpenAI Vision, Claude Vision, or Gemini Vision in Phase 7 was considered
and rejected. Reasons:

1. Identification logic would be entangled with model-specific behavior
2. Switching or updating models would require changing identification logic
3. Confidence scores would be model outputs, not evidence-based reasoning
4. The intelligence engine would never be independently validated

### pgvector semantic matching (deferred to Phase 9)

Generating vector embeddings from ball descriptions and matching against uploaded
image embeddings is the long-term path. This requires the identification engine to
be correct first — vectors of incorrect data produce incorrect matches.

---

_Created: 2026-06-11 — Phase 7: Identification Intelligence_
