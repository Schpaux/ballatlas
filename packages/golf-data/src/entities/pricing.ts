import type { Tables, Enums } from '@ballatlas/database'

export type PriceObservation = Tables<'price_observations'>
export type PriceCondition = Enums<'price_condition'>

export const PRICE_CONDITION_LABELS: Record<PriceCondition, string> = {
  new: 'New',
  mint: 'Mint',
  near_mint: 'Near Mint',
  good: 'Good',
  fair: 'Fair',
  recycled: 'Recycled / Refinished',
  lake_ball: 'Lake Ball',
}

// Conditions ordered from best to worst (for display and sorting)
export const PRICE_CONDITION_ORDER: PriceCondition[] = [
  'new',
  'mint',
  'near_mint',
  'good',
  'fair',
  'recycled',
  'lake_ball',
]

// Latest price for a given condition from a list of observations
export function latestPrice(
  observations: PriceObservation[],
  condition: PriceCondition
): PriceObservation | null {
  const filtered = observations
    .filter((o) => o.condition === condition)
    .sort((a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime())
  return filtered[0] ?? null
}

export function formatPrice(price: number, currency: string): string {
  if (currency === 'NOK') return `kr ${price.toFixed(0)}`
  if (currency === 'USD') return `$${price.toFixed(2)}`
  if (currency === 'GBP') return `£${price.toFixed(2)}`
  return `${currency} ${price.toFixed(2)}`
}
