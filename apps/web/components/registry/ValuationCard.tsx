type PriceObservation = {
  condition: string
  price: number
  currency: string
  observed_at: string
}

type ConditionMultiplier = {
  condition: string
  multiplier: number
}

type ValuationRule = {
  age_adjustment: number
  demand_adjustment: number
  availability_adjustment: number
}

type ValuationProfile = {
  segment: string
  condition_multipliers: ConditionMultiplier[]
  valuation_rules: ValuationRule[]
} | null

export type ValuationCardProps = {
  primarySegment: string | null
  releaseYear: number | null
  priceObservations: PriceObservation[]
  valuationProfile: ValuationProfile
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  mint: 'Mint',
  near_mint: 'Near Mint',
  good: 'Good',
  fair: 'Fair',
  recycled: 'Recycled',
  lake_ball: 'Lake Ball',
}

function fmt(price: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

export function ValuationCard({
  primarySegment,
  releaseYear,
  priceObservations,
  valuationProfile,
}: ValuationCardProps) {
  // Find the most recent "new" condition observation as the base price
  const newObs = priceObservations
    .filter((o) => o.condition === 'new')
    .sort((a, b) => b.observed_at.localeCompare(a.observed_at))[0]

  const hasMarketData = priceObservations.length > 0

  // No market data state
  if (!hasMarketData) {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-neutral-300">Market Value</p>
            {primarySegment && (
              <p className="mt-0.5 text-xs capitalize text-neutral-600">
                {primarySegment.replace('-', ' ')} segment
              </p>
            )}
          </div>
          <span className="rounded-full bg-neutral-800 px-2 py-1 text-xs text-neutral-500">
            No data yet
          </span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-neutral-600">
          Market data for this ball hasn&apos;t been collected yet. Valuations are based on observed
          sale prices — missing values are left empty rather than estimated.
        </p>
        {valuationProfile && (
          <p className="mt-2 text-xs text-neutral-700">
            Profile: {valuationProfile.segment} · {valuationProfile.condition_multipliers.length}{' '}
            condition tiers defined
          </p>
        )}
      </div>
    )
  }

  // Compute estimated range using profile multipliers
  const basePrice = newObs?.price ?? null
  const rule = valuationProfile?.valuation_rules[0]
  const currentYear = new Date().getFullYear()
  const ageMultiplier =
    rule && releaseYear
      ? Math.max(0.5, rule.age_adjustment * (1 - (currentYear - releaseYear) * 0.01))
      : 1
  const combinedMultiplier = rule
    ? ageMultiplier * rule.demand_adjustment * rule.availability_adjustment
    : 1

  // Build condition breakdown from profile multipliers
  const multipliers = valuationProfile?.condition_multipliers ?? []
  const conditionRows = multipliers
    .filter((m) => ['mint', 'near_mint', 'good', 'fair'].includes(m.condition))
    .sort((a, b) => b.multiplier - a.multiplier)

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-300">Market Value</p>
          {primarySegment && (
            <p className="mt-0.5 text-xs capitalize text-neutral-600">
              {primarySegment.replace('-', ' ')} segment
            </p>
          )}
        </div>
        {basePrice != null && (
          <p className="font-mono text-lg font-semibold text-neutral-100">
            {fmt(basePrice, newObs?.currency ?? 'USD')}
            <span className="ml-1 text-xs font-normal text-neutral-600">new</span>
          </p>
        )}
      </div>

      {/* Condition breakdown */}
      {conditionRows.length > 0 && basePrice != null && (
        <div className="divide-y divide-white/[0.04]">
          {conditionRows.map((m) => {
            const estimated = basePrice * m.multiplier * combinedMultiplier
            return (
              <div key={m.condition} className="flex items-center justify-between py-2">
                <span className="text-xs text-neutral-500">
                  {CONDITION_LABELS[m.condition] ?? m.condition}
                </span>
                <span className="font-mono text-xs text-neutral-300">{fmt(estimated, 'USD')}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Observation count */}
      <p className="mt-3 text-xs text-neutral-700">
        Based on {priceObservations.length} market observation
        {priceObservations.length !== 1 ? 's' : ''}
        {releaseYear
          ? ` · ${currentYear - releaseYear} year${currentYear - releaseYear !== 1 ? 's' : ''} on market`
          : ''}
      </p>
    </div>
  )
}
