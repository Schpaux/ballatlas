# BallAtlas Platform Generalization Review

**Phase:** 6 — Platform Generalization & Asset Strategy  
**Date:** 2026-06-10  
**Author:** Principal Architect

---

## Purpose

This review answers five structural questions about the current BallAtlas data model,
then documents findings and recommendations for the platform's evolutionary path.

The current model is:

```
Brand → Family → Version
```

The candidate generalized model is:

```
Manufacturer → Product Line → Product Version
```

---

## Question 1: Which parts of the current model are golf-ball specific?

### Highly specific (cannot reuse as-is)

| Artifact                           | Why it's golf-ball specific                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `technical_specs` columns          | `compression`, `dimple_count`, `dimple_pattern`, `launch_profile`, `spin_profile`, `feel_profile` are golf-ball physics |
| `visual_signatures` columns        | `logo_text`, `alignment_marking`, `number_style`, `number_color` assume a small white sphere                            |
| `identification_features` enum     | `alignment_marking`, `dimple_pattern`, `number_color` are ball-specific identification vectors                          |
| `segments` reference data          | `tour-premium`, `distance`, `soft-feel`, `lake-ball` — golf market categories                                           |
| `packages/golf-data` namespace     | All domain types named for golf context                                                                                 |
| `pnpm import:balls` pipeline       | Hardcoded to brands/families/versions ball JSON structure                                                               |
| Similarity algorithm weights       | `compression`, `spinProfile`, `feelProfile`, `dimple_count` as similarity signals                                       |
| Valuation formula                  | `age_adjustment`, `demand_adjustment`, `availability_adjustment` calibrated to golf ball market                         |
| `ball_aliases` table               | Alias system for ball names specifically                                                                                |
| `msrp_usd`, `msrp_nok` on versions | Per-dozen MSRP — golf balls are sold by the dozen                                                                       |

### Moderately specific (requires light abstraction to generalize)

| Artifact                         | What's domain-specific                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| `ball_status` enum               | Named `ball_status` but `draft/published/archived/discontinued` is generic                       |
| `images` table `image_type` enum | `hero/logo/alignment/number/side/dimple/packaging` — `alignment/number/dimple` are ball-specific |
| `price_observations` structure   | Table is generic; `condition` enum values include `lake_ball` which is domain-specific           |
| Valuation profiles               | Three-table structure is reusable; the profiles themselves are golf-ball calibrated              |
| FTS `search_vector`              | Pattern is reusable; `name` weighting is generic                                                 |

---

## Question 2: Which parts are already reusable?

### Fully reusable today (zero changes needed)

| Artifact                                                           | Why it's already generic                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Brand → Family → Version hierarchy                                 | Three-tier parent/child structure applies to any product taxonomy                           |
| `brands` table structure                                           | `name`, `slug`, `country`, `website`, `logo_url` apply to any manufacturer                  |
| `ball_families` table structure                                    | `name`, `slug`, `description`, `first/last_release_year`, `status` are product-line generic |
| `ball_versions` core columns                                       | `name`, `slug`, `release_year`, `release_date`, `status` are product-release generic        |
| `sources` table                                                    | Provenance registry applies to any domain                                                   |
| `price_observations` table                                         | Time-series pricing is universally applicable                                               |
| `valuation_profiles` + `condition_multipliers` + `valuation_rules` | Formula and structure are generic                                                           |
| `feedback_submissions`                                             | Generic community correction workflow                                                       |
| `images` table structure                                           | Mostly reusable except the `image_type` enum                                                |
| `ball_aliases` table structure                                     | Alias/synonym system is generic; could rename to `product_aliases`                          |
| RLS policy patterns                                                | Service-role for writes, public for published reads                                         |
| `AcquisitionResult<T>` type                                        | Generic discriminated union                                                                 |
| `PriceProvider`, `ImageProvider`, `VersionProvider` interfaces     | Provider abstractions are fully generic                                                     |
| Intelligence layer: `computeCompleteness()`                        | Completeness scoring is generic                                                             |
| Intelligence layer: `buildDifferenceSummary()`                     | Field diff logic is generic                                                                 |
| Vercel + Supabase + Next.js stack                                  | Infrastructure is product-agnostic                                                          |
| Monorepo package boundary rules                                    | Package isolation pattern is fully reusable                                                 |

---

## Question 3: Which parts would break if drivers were introduced?

### Breaking changes if drivers were added today

1. **`technical_specs` table is 1:1 with `ball_versions`** — driver specs (loft, shaft flex,
   head size, face angle, adjustability) have zero overlap. A single `technical_specs` table
   cannot serve both without becoming a sparse EAV anti-pattern with mostly NULL columns.

2. **`visual_signatures` assumptions** — `alignment_marking`, `logo_text`, `number_style`
   assume a sphere. A driver head has completely different visual identification cues.

3. **`segments` reference data** — `tour-premium/distance/soft-feel/lake-ball` are ball market
   categories. Driver segmentation (`low-handicap`, `game-improvement`, `super-game-improvement`)
   is different vocabulary.

4. **`identification_features` enum values** — `dimple_pattern`, `number_color`, `alignment_marking`
   do not apply to clubs.

5. **`msrp_usd/msrp_nok` as per-dozen** — Drivers are per-unit. The column is correctly typed
   (`numeric`) but its semantic meaning would change, creating confusion.

6. **`price_condition` enum** — `lake_ball` condition type is ball-specific.

7. **Similarity algorithm** — `compressionBrackets`, `feelProfile`, `spinProfile` as similarity
   signals are meaningless for clubs.

8. **URL structure** — `/balls/[slug]` would be inapplicable for drivers.

### Not breaking (already isolated)

- `brands` table — works for any manufacturer
- `ball_families` table structure — works for any product line
- `ball_versions` core columns — works for any product release
- `sources`, `price_observations` — generic
- Admin UI patterns — reusable

### Conclusion

Adding drivers today would require **parallel spec tables** (one per product category)
and **diverged URL structures**. The primary risk is technical_specs becoming a
catch-all table with 80% NULL columns per row. The right approach is per-category
spec tables joined to a shared `product_versions` base table.

---

## Question 4: Which parts would break if putters were introduced?

Putters are clubs. All findings from Question 3 apply. Additional considerations:

- Putters have head styles (blade, mallet, face-balanced), hosel types, loft, and lie
  — none overlap with golf ball specs
- Putter visual identification relies on head shape and alignment aid geometry,
  not logo text and dimple patterns
- Condition vocabulary for putters (`used`, `mint`, `refurbished`) overlaps more
  cleanly with generic condition types — `lake_ball` is the only ball-specific outlier

Putter introduction would break the same systems as drivers.

---

## Question 5: Which parts would break if golf bags were introduced?

Golf bags have even less technical spec overlap:

- Specs: `number_of_pockets`, `strap_type`, `stand_leg_material`, `waterproof`
- No meaningful compression, dimple, or feel profiles
- Condition: `lake_ball` still inapplicable; otherwise generic
- No launch/spin profile equivalents

Golf bags would additionally expose:

- **The `msrp_usd`/`msrp_nok` per-dozen semantic** as actively misleading (bags are per-unit)
- **The FTS search vector schema** as workable (name search is generic)
- **The brand hierarchy** as fully valid — TaylorMade bags and TaylorMade balls share a brand

Golf bags would break the same systems as clubs, with the additional finding that
the valuation model needs calibration for accessories (bags don't lose value with
`age_adjustment` the same way balls do).

---

## Findings Summary

### What works

| Capability           | Generalization potential                                          |
| -------------------- | ----------------------------------------------------------------- |
| Three-tier hierarchy | High — rename Brand/Family/Version                                |
| Provenance & sources | High — fully generic                                              |
| Pricing & valuation  | High — formula generalizes; segment data stays domain-specific    |
| Admin CRUD patterns  | High — forms, tables, actions are reusable                        |
| Image management     | Medium — table structure is fine; image_type enum needs extension |
| Alias system         | High — any product can have alternate names                       |
| Feedback             | High — community corrections are domain-agnostic                  |

### What doesn't

| Capability                     | Why it doesn't generalize                              |
| ------------------------------ | ------------------------------------------------------ |
| `technical_specs` table        | Golf-ball column set; per-category divergence required |
| `visual_signatures` table      | Ball-specific visual cues                              |
| `identification_features` enum | Ball-specific identification signals                   |
| Similarity algorithm           | Ball-specific signals (compression, feel, spin)        |
| `segments` reference data      | Market categories are domain vocabulary                |

---

## Recommendation

**Do not rewrite the working ball registry.** The current system is correct and
production-ready for golf balls.

**The path to generalization is additive, not replacement:**

1. Rename `ball_status` → `product_status` when the first new category is introduced
2. Introduce a shared `product_versions` base table as a future view or parent table
3. Create per-category spec tables (`driver_specs`, `putter_specs`) joined to base version
4. Keep `technical_specs` (ball-specific) as-is — it's the first implementation of a pattern
5. Generalize `image_type` enum when new image categories are needed
6. Generalize `segments` per-domain using a `domain` discriminator column when ready

The migration path is documented in ADR-014.

---

_See also: ADR-014 (Product Domain Generalization), docs/platform/future-equipment-strategy.md_
