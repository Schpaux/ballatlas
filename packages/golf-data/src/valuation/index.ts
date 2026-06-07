// Valuation framework — Phase 3 placeholder
//
// This module will contain:
//   - Price trend analysis
//   - Condition-based value estimation
//   - Market value range calculation
//   - Historical value charting data
//
// The price_observations table (append-only time-series) is the data
// foundation. Phase 3 will add the analysis logic here.
//
// See ROADMAP.md Phase 3 for planned deliverables.

export type ValuationRange = {
  low: number
  mid: number
  high: number
  currency: string
}

export type ValuationInput = {
  version_id: string
  condition: string
  market?: string
  currency?: string
}
