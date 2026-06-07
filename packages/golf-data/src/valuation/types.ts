// Legacy types kept for backwards compatibility with Phase 3 ValuationCard component.
// New code should use ValuationOutput from engine.ts.

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
