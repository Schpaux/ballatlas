// Valuation Engine v1
//
// Computes estimated price ranges from real price_observations + valuation profile rules.
// Never fabricates values. Confidence degrades when observations are sparse, old, or
// from low-reliability sources.
//
// Formula (from ADR-008):
//   estimated = base × condition_multiplier × age_adj × demand_adj × avail_adj
//
// See docs/valuation/README.md for the full decision tree and assumption log.

import type { PriceCondition } from '../entities/pricing'

// ─── Input types ─────────────────────────────────────────────────────────────

export type ObservationInput = {
  price: number
  currency: string
  condition: PriceCondition
  observed_at: string
  source_reliability: number // 1–10
  is_archived: boolean
}

export type ConditionMultiplierInput = {
  condition: string
  multiplier: number
}

export type ValuationRuleInput = {
  age_adjustment: number
  demand_adjustment: number
  availability_adjustment: number
}

export type ValuationEngineInput = {
  version_id: string
  release_year: number | null
  target_condition: PriceCondition
  market?: string
  currency?: string
  observations: ObservationInput[]
  condition_multipliers: ConditionMultiplierInput[]
  valuation_rule: ValuationRuleInput | null
}

// ─── Output types ─────────────────────────────────────────────────────────────

export type ValuationOutput = {
  low: number
  mid: number
  high: number
  currency: string
  confidence: number // 0.0–1.0
  confidence_reason: string
  observation_count: number
  data_age_days: number | null
}

export type ValuationResult =
  | { ok: true; valuation: ValuationOutput }
  | { ok: false; reason: string }

// ─── Engine ───────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()

export function computeValuation(input: ValuationEngineInput): ValuationResult {
  const {
    release_year,
    target_condition,
    currency = 'USD',
    observations,
    condition_multipliers,
    valuation_rule,
  } = input

  // Active observations only, matching requested currency
  const active = observations.filter((o) => !o.is_archived && o.currency === currency)

  // Find observations for target condition directly, or fall back to all active
  const directObs = active.filter((o) => o.condition === target_condition)
  const allActive = active

  if (allActive.length === 0) {
    return { ok: false, reason: 'No price observations available for this ball.' }
  }

  // Prefer direct condition observations; fall back to cross-condition adjustment
  let basePrice: number
  let usedCrossCondition = false

  if (directObs.length >= 2) {
    basePrice = median(directObs.map((o) => o.price))
  } else if (directObs.length === 1) {
    basePrice = directObs[0]!.price
  } else {
    // No direct observations for this condition — derive from mint/new prices
    const referenceObs = allActive.filter((o) => o.condition === 'mint' || o.condition === 'new')
    if (referenceObs.length === 0) {
      return {
        ok: false,
        reason: `No price data for condition "${target_condition}" and no reference condition available.`,
      }
    }
    const refPrice = median(referenceObs.map((o) => o.price))
    const multiplier = findConditionMultiplier(condition_multipliers, target_condition)
    if (multiplier === null) {
      return {
        ok: false,
        reason: `No condition multiplier configured for "${target_condition}".`,
      }
    }
    basePrice = refPrice * multiplier
    usedCrossCondition = true
  }

  // Apply valuation rule adjustments
  const rule: ValuationRuleInput = valuation_rule ?? {
    age_adjustment: 1.0,
    demand_adjustment: 1.0,
    availability_adjustment: 1.0,
  }

  const adjustedMid =
    basePrice * rule.age_adjustment * rule.demand_adjustment * rule.availability_adjustment

  // Range: ±15% from mid, with floor at zero
  const spread = adjustedMid * 0.15
  const low = Math.max(0, adjustedMid - spread)
  const high = adjustedMid + spread

  // Confidence scoring
  const confidence = computeConfidence({
    observationCount: directObs.length > 0 ? directObs.length : allActive.length,
    averageReliability: averageReliability(directObs.length > 0 ? directObs : allActive),
    dataAgeDays: dataAgeDays(directObs.length > 0 ? directObs : allActive),
    usedCrossCondition,
    hasValuationRule: valuation_rule !== null,
    releaseYear: release_year,
  })

  const latestObservedAt = mostRecentDate(directObs.length > 0 ? directObs : allActive)
  const ageDays = latestObservedAt
    ? Math.floor((Date.now() - new Date(latestObservedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return {
    ok: true,
    valuation: {
      low: round2(low),
      mid: round2(adjustedMid),
      high: round2(high),
      currency,
      confidence: round2(confidence.score),
      confidence_reason: confidence.reason,
      observation_count: directObs.length > 0 ? directObs.length : allActive.length,
      data_age_days: ageDays,
    },
  }
}

// ─── Confidence scoring ───────────────────────────────────────────────────────

type ConfidenceFactors = {
  observationCount: number
  averageReliability: number
  dataAgeDays: number | null
  usedCrossCondition: boolean
  hasValuationRule: boolean
  releaseYear: number | null
}

type ConfidenceResult = { score: number; reason: string }

function computeConfidence(f: ConfidenceFactors): ConfidenceResult {
  let score = 1.0
  const notes: string[] = []

  // Observation count (most important factor)
  if (f.observationCount === 0) {
    return { score: 0.0, reason: 'No observations.' }
  } else if (f.observationCount === 1) {
    score *= 0.6
    notes.push('single observation')
  } else if (f.observationCount < 5) {
    score *= 0.8
    notes.push('few observations')
  }

  // Source reliability (1–10 scale; normalize to 0–1)
  const reliabilityFactor = Math.min(f.averageReliability, 10) / 10
  if (reliabilityFactor < 0.7) {
    score *= reliabilityFactor
    notes.push('lower-reliability sources')
  }

  // Data age (observations > 365 days old are stale)
  if (f.dataAgeDays !== null && f.dataAgeDays > 365) {
    const staleFactor = Math.max(0.4, 1 - (f.dataAgeDays - 365) / (365 * 2))
    score *= staleFactor
    notes.push('data older than 1 year')
  }

  // Cross-condition extrapolation reduces confidence
  if (f.usedCrossCondition) {
    score *= 0.75
    notes.push('extrapolated from different condition')
  }

  // No valuation rule means no segment-based adjustments
  if (!f.hasValuationRule) {
    score *= 0.9
    notes.push('no segment adjustments configured')
  }

  // Very old balls (>20 years) have less reliable pricing
  if (f.releaseYear !== null && CURRENT_YEAR - f.releaseYear > 20) {
    score *= 0.85
    notes.push('vintage ball (>20 years)')
  }

  const reason = notes.length === 0 ? 'Good data coverage.' : `Reduced: ${notes.join(', ')}.`

  return { score: Math.max(0, Math.min(1, score)), reason }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? (sorted[mid] ?? 0)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
}

function findConditionMultiplier(
  multipliers: ConditionMultiplierInput[],
  condition: PriceCondition
): number | null {
  const match = multipliers.find((m) => m.condition.toLowerCase() === condition.toLowerCase())
  return match?.multiplier ?? null
}

function averageReliability(obs: ObservationInput[]): number {
  if (obs.length === 0) return 5
  return obs.reduce((sum, o) => sum + o.source_reliability, 0) / obs.length
}

function dataAgeDays(obs: ObservationInput[]): number | null {
  const latest = mostRecentDate(obs)
  if (!latest) return null
  return Math.floor((Date.now() - new Date(latest).getTime()) / (1000 * 60 * 60 * 24))
}

function mostRecentDate(obs: ObservationInput[]): string | null {
  if (obs.length === 0) return null
  return obs.reduce(
    (latest, o) => (o.observed_at > latest ? o.observed_at : latest),
    obs[0]!.observed_at
  )
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
