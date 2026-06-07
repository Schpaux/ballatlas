# Valuation Engine v1

The Valuation Engine computes estimated price ranges from real `price_observations`
combined with the three-table valuation framework (ADR-008).

Location: `packages/golf-data/src/valuation/engine.ts`

---

## Formula

```
estimated_mid = base_price × condition_multiplier × age_adj × demand_adj × avail_adj

range:
  low  = mid × 0.85
  high = mid × 1.15
```

Where:

- `base_price` = median of active price observations for the target condition
- `condition_multiplier` = from `condition_multipliers` table for this profile
- `age_adj`, `demand_adj`, `avail_adj` = from `valuation_rules` for this profile

When no direct observations exist for the target condition, the engine derives
base_price from mint/new observations via the condition multiplier.

## Confidence Scoring (0.0–1.0)

Confidence degrades when data is sparse, stale, or from low-reliability sources.

| Factor                         | Impact                  |
| ------------------------------ | ----------------------- |
| Single observation             | −40%                    |
| < 5 observations               | −20%                    |
| Average source reliability < 7 | Scaled proportionally   |
| Data older than 1 year         | Up to −60% over 2 years |
| Cross-condition extrapolation  | −25%                    |
| No valuation rule configured   | −10%                    |
| Vintage ball (>20 years old)   | −15%                    |

**Confidence of 0.0** = no data available. The engine never fabricates values;
it returns `ok: false` with a reason string instead.

## Inputs

```ts
ValuationEngineInput {
  version_id: string
  release_year: number | null
  target_condition: PriceCondition
  market?: string           // default: any
  currency?: string         // default: 'USD'
  observations: ObservationInput[]
  condition_multipliers: ConditionMultiplierInput[]
  valuation_rule: ValuationRuleInput | null
}
```

## Outputs

```ts
ValuationOutput {
  low: number
  mid: number
  high: number
  currency: string
  confidence: number          // 0.0–1.0
  confidence_reason: string   // human-readable explanation
  observation_count: number
  data_age_days: number | null
}
```

## Usage Example

```ts
import { computeValuation } from '@ballatlas/golf-data'

const result = computeValuation({
  version_id: 'abc-123',
  release_year: 2023,
  target_condition: 'mint',
  currency: 'USD',
  observations: [...], // from price_observations table
  condition_multipliers: [...], // from condition_multipliers table
  valuation_rule: { age_adjustment: 0.95, demand_adjustment: 1.1, availability_adjustment: 1.0 },
})

if (result.ok) {
  const { low, mid, high, confidence, confidence_reason } = result.valuation
}
```

## Valuation Profiles

Profiles define the valuation context per market segment.
Each active profile has:

- One row in `valuation_profiles` (segment name, is_active)
- Multiple rows in `condition_multipliers` (condition → multiplier scale)
- One row in `valuation_rules` (age/demand/availability adjustments)

Admin at: `/admin/valuation`

## Assumptions Documented

| Assumption           | Value    | Rationale                                         |
| -------------------- | -------- | ------------------------------------------------- |
| Range spread         | ±15%     | Typical used golf ball market price variance      |
| Stale threshold      | 365 days | Market pricing changes meaningfully within 1 year |
| Vintage threshold    | 20 years | Collector market dynamics differ from new market  |
| Min confidence floor | 0.0      | Never show a confidence below zero                |

All assumptions are in `engine.ts`. None are hidden or hardcoded in the DB.
