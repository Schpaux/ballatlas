import type { ValuationResult } from '@ballatlas/golf-data'

export type ValuationCardProps = {
  primarySegment: string | null
  valuationResult: ValuationResult | null
}

function fmt(price: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'NOK' ? 'NOK' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-neutral-600'
  const textColor =
    pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-neutral-500'
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-1 w-16 overflow-hidden rounded-full bg-neutral-800">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs ${textColor}`}>{pct}% confidence</span>
    </div>
  )
}

export function ValuationCard({ primarySegment, valuationResult }: ValuationCardProps) {
  if (!valuationResult || !valuationResult.ok) {
    const reason = valuationResult && !valuationResult.ok ? valuationResult.reason : null
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-neutral-400">Market Value</p>
            {primarySegment && (
              <p className="mt-0.5 text-xs capitalize text-neutral-600">
                {primarySegment.replace(/-/g, ' ')}
              </p>
            )}
          </div>
          <span className="rounded-full bg-neutral-800 px-2 py-1 text-xs text-neutral-600">
            No data
          </span>
        </div>
        <p className="text-xs leading-relaxed text-neutral-700">
          {reason ??
            'Market data for this ball hasn’t been collected yet. Valuations are based on observed sale prices — missing values are left empty rather than estimated.'}
        </p>
      </div>
    )
  }

  const { valuation } = valuationResult

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-neutral-400">Market Value</p>
          {primarySegment && (
            <p className="mt-0.5 text-xs capitalize text-neutral-600">
              {primarySegment.replace(/-/g, ' ')}
            </p>
          )}
        </div>
      </div>

      {/* Price range — primary data */}
      <div className="mb-1">
        <p className="font-mono text-2xl font-bold tracking-tight text-neutral-100">
          {fmt(valuation.low, valuation.currency)}
          <span className="mx-2 text-base font-normal text-neutral-600">–</span>
          {fmt(valuation.high, valuation.currency)}
        </p>
      </div>
      <p className="mb-4 text-xs text-neutral-600">
        Mint condition · mid {fmt(valuation.mid, valuation.currency)}
      </p>

      <ConfidenceBar score={valuation.confidence} />

      {/* Footer meta */}
      <p className="mt-3 text-xs text-neutral-700">
        {valuation.observation_count} market observation
        {valuation.observation_count !== 1 ? 's' : ''}
        {valuation.data_age_days != null && ` · data ${valuation.data_age_days}d old`}
      </p>
      {valuation.confidence < 0.7 && (
        <p className="mt-1 text-xs text-neutral-700">{valuation.confidence_reason}</p>
      )}
    </div>
  )
}
